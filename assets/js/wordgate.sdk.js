/**
 * WordGate JavaScript 客户端
 * 为Web应用提供与WordGate API的交互能力
 */
class WordGate {
  constructor(config = {}) {
    this.base_url = config.base_url || "";
    this.app_code = config.app_code || null;
    this.use_jsonp = typeof config.use_jsonp === 'boolean' ? config.use_jsonp : false;
    this._resource_cache = {};
  }

  /**
   * 地址选择器
   */
  address_picker = {
    _listeners: [],
    _currentAddress: null,
    
    onChanged(callback) {
      this._listeners.push(callback);
      return () => {
        this._listeners = this._listeners.filter(listener => listener !== callback);
      };
    },
    
    _triggerChange(address) {
      this._currentAddress = address;
      this._listeners.forEach(listener => listener(address));
    },
    
    selectAddress(address) {
      this._triggerChange(address);
    },
    
    getCurrentAddress() {
      return this._currentAddress;
    },
    
    clearSelection() {
      this._triggerChange(null);
    }
  };

  /**
   * 购物车操作
   */
  cart = {
    _listeners: [],
    onChanged(callback) {
      const cart = this; // 保存正确的 this 引用
      cart._listeners.push(callback);

      return () => {
        cart._listeners = cart._listeners.filter(
          (listener) => listener !== callback
        );
      };
    },
    _triggerChange(items) {
      this._listeners.forEach((listener) => listener(items));
    },
    getItems() {
      return JSON.parse(localStorage.getItem("wordgate_cart") || "[]");
    },
    saveItems(items) {
      localStorage.setItem("wordgate_cart", JSON.stringify(items || []));
    },
    addItem(item) {
      let items = this.getItems();
      const existingItemIndex = items.findIndex((i) => i.code === item.code);

      if (existingItemIndex >= 0) {
        // 更新现有商品数量
        const updatedItems = [...items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity:
            updatedItems[existingItemIndex].quantity + (item.quantity || 1),
        };
        this.saveItems(updatedItems);
      } else {
        // 添加新商品
        this.saveItems([...items, { ...item, quantity: item.quantity || 1 }]);
      }

      this._triggerChange(this.getItems());
    },

    removeItem(itemCode) {
      const items = this.getItems().filter((item) => item.code !== itemCode);
      this.saveItems(items);
      this._triggerChange(items);
    },

    updateQuantity(itemCode, quantity) {
      const items = this.getItems()
        .map((item) => (item.code === itemCode ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0);
      this.saveItems(items);
      this._triggerChange(items);
    },

    clear() {
      this.saveItems([]);
      this._triggerChange([]);
    },

    getTotalPrice() {
      const items = this.getItems();
      return items.reduce((total, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = item.quantity || 0;
        return total + price * quantity;
      }, 0);
    },
  };

  auth = {
    _listeners: [],
    onChanged(callback) {
      const auth = this;
      auth._listeners.push(callback);

      return () => {
        auth._listeners = auth._listeners.filter(
          (listener) => listener !== callback
        );
      };
    },
    _triggerChange(loggedIn) {
      this._listeners.forEach((listener) => listener(loggedIn));
    },

    isLoggedIn() {
      return !!this.getToken();
    },

    /**
     * 获取当前登录令牌
     * 如果令牌不存在或已过期，返回null
     * @returns {string|null} 令牌或null
     */
    getToken() {
      const token = localStorage.getItem("wordgate_token");
      if (!token) return null;

      try {
        const tokenData = JSON.parse(token);
        // 检查token是否过期
        if (tokenData.expired_at && Date.now() > tokenData.expired_at) {
          this.logout();
          return null;
        }
        return tokenData.token;
      } catch (e) {
        this.logout();
        return null;
      }
    },

    /**
     * 设置登录令牌
     * 注意：此方法处理的是常规的会话令牌（Session Token），不是JWT令牌
     * - token: 会话令牌，由后端 auth/login 或 auth/verify 接口返回
     * - expired_at: 过期时间戳（秒级），由后端提供
     * - user_id: 用户ID
     * - user: 用户完整信息对象
     */
    setToken({token, expired_at, user_id, user}) {
      if (token) {
        const tokenData = {
          token: token,
          expired_at: expired_at * 1000, // 将后端返回的秒级时间戳转换为毫秒
          user_id: user_id
        };
        localStorage.setItem("wordgate_token", JSON.stringify(tokenData));
        
        // 保存用户信息
        if (user) {
          localStorage.setItem("wordgate_profile", JSON.stringify(user));
        }
      } else {
        localStorage.removeItem("wordgate_token");
      }
      this._triggerChange(this.isLoggedIn());
    },

    /**
     * 获取用于API请求的认证头
     * @returns {string} Bearer 认证头
     */
    getAuthorizationHeader() {
      const token = this.getToken();
      return token ? `Bearer ${token}` : "";
    },

    /**
     * 退出登录，清除所有存储的认证信息
     */
    logout() {
      localStorage.removeItem("wordgate_token");
      localStorage.removeItem("wordgate_profile");
      this._triggerChange(false);
    },
  };

  user = {
    getProfile() {
      return JSON.parse(localStorage.getItem("wordgate_profile") || "{}");
    },

    setProfile(profile) {
      if (profile) {
        localStorage.setItem("wordgate_profile", JSON.stringify(profile));
      }
    },

    /**
     * 检查用户是否有管理员权限
     * @returns {boolean} 是否有管理员权限
     */
    hasManagerRole() {
      const profile = this.getProfile();
      return profile.role === 'admin' || profile.role === 'owner';
    },

    /**
     * 检查用户是否是应用所有者
     * @returns {boolean} 是否是所有者
     */
    isOwner() {
      const profile = this.getProfile();
      return profile.role === 'owner';
    },
  };

  /**
   * 通用辅助函数
   */
  helper = {
    /**
     * 格式化货币金额
     * @param {number|string} amount - 金额（以分为单位）
     * @param {string} currency - 货币类型，默认 CNY
     * @param {number} minimumFractionDigits - 最少小数位数，默认2
     * @returns {string} 格式化后的货币字符串
     */
    formatMoney: (amount, currency = '', minimumFractionDigits = 2) => {
      // 价格可能是以分为单位，需要除以100
      if (!currency) {
        currency = window.wordgate_config.currency || "USD";
      }
      const decimalAmount = typeof amount === 'number' ? amount / 100 : parseFloat(amount) / 100;
      return new Intl.NumberFormat(undefined, { 
        style: 'currency', 
        currency: currency,
        minimumFractionDigits: minimumFractionDigits
      }).format(decimalAmount);
    },

    /**
     * 格式化日期时间
     * @param {string|Date} dateStr - 日期字符串或Date对象
     * @param {string} locale - 区域设置，默认 zh-CN
     * @returns {string} 格式化后的日期时间字符串
     */
    formatDate: (dateStr, locale = 'zh-CN') => {
      return new Date(dateStr).toLocaleString(locale);
    },

    /**
     * 将金额从分转换为元
     * @param {number|string} amount - 金额（以分为单位）
     * @returns {number} 转换后的金额（以元为单位）
     */
    convertToDecimal: (amount) => {
      return typeof amount === 'number' ? amount / 100 : parseFloat(amount) / 100;
    },

    /**
     * 获取URL查询参数
     * @param {string} name - 参数名
     * @returns {string|null} 参数值
     */
    getQueryParam: (name) => {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(name);
    }
  };

  /**
   * 选择资源
   */
  with(resource_name) {
    const name = resource_name.toLowerCase();
    if (!this._resource_cache[name]) {
      switch (name) {
        case "auth":
          this._resource_cache[name] = {
            login: this._make_resource_method("POST", "/api/auth/login"),
            send_code: this._make_resource_method("POST", "/api/auth/sendcode"),
            verify_code: this._make_resource_method("POST", "/api/auth/verify"),
            status: this._make_resource_method("GET", "/api/auth/status"),
            oauth_providers: this._make_resource_method("GET", "/api/auth/oauth/providers"),
            oauth_login: this._make_resource_method("POST", "/api/auth/oauth/login"),
            oauth_authorize: this._make_resource_method("POST", "/api/auth/oauth/authorize")
          };
          break;
        case "user":
          this._resource_cache[name] = {
            get_profile: this._make_resource_method("GET", "/api/user/profile"),
            update_profile: this._make_resource_method(
              "PUT",
              "/api/user/profile"
            ),
            change_password: this._make_resource_method(
              "PUT",
              "/api/user/password"
            ),
          };
          break;
        case "addresses":
          this._resource_cache[name] = {
            list: (params = {}) => {
              const query = new URLSearchParams(params).toString();
              return this.request("GET", `/api/addresses?${query}`);
            },
            create: this._make_resource_method("POST", "/api/addresses"),
            get: (id) => this.request("GET", `/api/addresses/${id}`),
            update: (id, data) =>
              this.request("PUT", `/api/addresses/${id}`, data),
            delete: (id) => this.request("DELETE", `/api/addresses/${id}`),
            set_default: (id) =>
              this.request("PUT", `/api/addresses/${id}/default`),
          };
          break;
        case "comments":
          this._resource_cache[name] = {
            list: (params = {}) => {
              const query = new URLSearchParams(params).toString();
              return this.request("GET", `/api/comments?${query}`);
            },
            create: this._make_resource_method("POST", "/api/comments"),
            get: (id) => this.request("GET", `/api/comments/${id}`),
            update: (id, data) =>
              this.request("PUT", `/api/comments/${id}`, data),
            delete: (id) => this.request("DELETE", `/api/comments/${id}`),
          };
          break;
        case "orders":
          this._resource_cache[name] = {
            create: this._make_resource_method("POST", "/api/orders/create"),
            list: (params = {}) => {
              const query = new URLSearchParams(params).toString();
              return this.request("GET", `/api/orders?${query}`);
            },
            get: (orderNo) => this.request("GET", `/api/orders/${orderNo}`),
            summary: (orderNo) => this.request("GET", `/api/orders/${orderNo}/summary`),
          };
          break;
        case "payments":
          this._resource_cache[name] = {
            methods: this._make_resource_method("GET", "/api/payments/methods"),
            create: this._make_resource_method("POST", "/api/payments"),
            cancel: (intentID) =>
              this.request("POST", `/api/payments/${intentID}/cancel`),
            get: (intentID) =>
              this.request("GET", `/api/payments/${intentID}`),
          };
          break;
        case "manager":
          this._resource_cache[name] = {
            // 产品管理 API
            products: {
              list: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return this.request("GET", `/app/products?${query}`);
              },
              create: (data) => this.request("POST", "/app/products", data),
              update: (code, data) => this.request("PUT", `/app/products/${code}`, data),
              delete: (code) => this.request("DELETE", `/app/products/${code}`),
              restore: (code) => this.request("POST", `/app/products/${code}/restore`),
              sync: () => this.request("POST", "/app/product/sync"),
            },
            // 订单管理 API
            orders: {
              list: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return this.request("GET", `/app/orders?${query}`);
              },
              get: (orderNo) => this.request("GET", `/app/orders/${orderNo}`),
              create: (data) => this.request("POST", "/app/orders/create", data),
              mark_as_paid: (data) => this.request("POST", "/app/orders/mark-as-paid", data),
            },
            // 用户管理 API
            users: {
              list: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return this.request("GET", `/app/users?${query}`);
              },
              get: (id) => this.request("GET", `/app/users/${id}`),
              update_status: (id, data) => this.request("POST", `/app/users/${id}/status`, data),
            },
            // 会员等级管理 API
            membership: {
              list: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return this.request("GET", `/app/membership/tiers?${query}`);
              },
              create: (data) => this.request("POST", "/app/membership/tiers", data),
              update: (code, data) => this.request("PUT", `/app/membership/tiers/${code}`, data),
              delete: (code) => this.request("DELETE", `/app/membership/tiers/${code}`),
              restore: (code) => this.request("POST", `/app/membership/tiers/${code}/restore`),
              sync: () => this.request("POST", "/app/membership/sync"),
            },
            // 应用配置管理 API
            config: {
              get: () => this.request("GET", "/app/config"),
              update: (data) => this.request("PUT", "/app/config", data),
            },
            // 应用信息管理 API
            profile: {
              get: () => this.request("GET", "/app/profile"),
              update: (data) => this.request("PUT", "/app/profile", data),
            },
          };
          break;
        default:
          throw new Error(`未知资源: ${resource_name}`);
      }
    }
    return this._resource_cache[name];
  }

  /**
   * 创建资源方法辅助函数
   */
  _make_resource_method(method, endpoint) {
    return (data) => this.request(method, endpoint, data);
  }

  /**
   * 发送API请求
   */
  async request(method, endpoint, data = null) {
    const start_time = performance.now();
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    if (this.use_jsonp) {
      return this._jsonp_request(method, path, data, start_time);
    } else {
      return this._ajax_request(method, path, data, start_time);
    }
  }

  /**
   * 使用AJAX方式发送请求（fetch）
   */
  async _ajax_request(method, endpoint, data, start_time) {
    const url = `${this.base_url}${endpoint}`;
    const headers = {};
    if (this.app_code) {
      headers["X-App-Code"] = this.app_code;
    }
    
    // 为管理 API 请求添加 App Secret 认证
    if (endpoint.startsWith('/app/')) {
      const appSecret = window.wordgate_config.app_secret;
      if (appSecret) {
        headers["X-App-Secret"] = appSecret;
      }
    }
    
    const userToken = this.auth.getToken();
    if (userToken) {
      headers["Authorization"] = `Bearer ${userToken}`;
    }
    let fetchOptions = {
      method: method,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 支持带cookie
    };
    if (data) {
      if (method.toUpperCase() === 'GET') {
        // GET 请求参数拼接到 URL
        const query = typeof data === 'string' ? data : new URLSearchParams(data).toString();
        endpoint += (endpoint.includes('?') ? '&' : '?') + query;
      } else {
        fetchOptions.body = JSON.stringify(data);
      }
    }
    try {
      const response = await fetch(url, fetchOptions);
      const contentType = response.headers.get('content-type') || '';
      const status = response.status;
      let body;
      if (contentType.includes('application/json')) {
        body = await response.json();
      } else {
        body = await response.text();
      }
      console.log(`[WordGate] [AJAX] 响应状态: ${status}`);
      console.log(`[WordGate] [AJAX] 请求完成，耗时: ${(performance.now() - start_time).toFixed(2)}ms`);
      if (status >= 200 && status < 300) {
        if (contentType.includes('application/json')) {
          const { code, message, data } = body;
          if (code === 0) {
            return body;
          } else {
            if (code === 401) {
              console.log("[WordGate] 检测到登录态失效，清除token");
              this.auth.logout();
            }
            const err = new Error(message || this.code_message(code));
            err.code = code;
            throw err;
          }
        } else {
          // 非JSON格式响应
          return body;
        }
      } else {
        // 错误状态码
        if (typeof body === 'object' && body !== null && body.message) {
          throw new Error(body.message);
        } else {
          throw new Error(`HTTP错误: ${status} - ${body}`);
        }
      }
    } catch (error) {
      console.error('[WordGate] [AJAX] 请求失败:', error);
      throw error;
    }
  }

  code_message(code) {
    switch (code) {
      case 401:
        return "需要登录";
      case 403:
        return "您无权限访问";
      case 404:
        return "资源不存在";
      case 422:
        return "参数错误";
      case 500:
        return "系统错误";
      default:
        return "请求失败";
    }
  }

  /**
   * 使用JSONP方式发送请求
   */
  async _jsonp_request(method, endpoint, data, start_time) {
    let path = endpoint;
    const url = `${this.base_url}/jsonp`;

    return new Promise((resolve, reject) => {
      const callback_name = "wg_" + Math.random().toString(36).substring(2, 15);

      /* 创建URL参数 */
      const params = {
        method: method,
        path: path,
        callback: callback_name,
      };

      /* 添加认证信息 */
      const headers = {};
      if (this.app_code) {
        headers["X-App-Code"] = this.app_code;
      }

      // 为管理 API 请求添加 App Secret 认证
      if (path.startsWith('/app/')) {
        const appSecret = window.wordgate_config.app_secret;
        if (appSecret) {
          headers["X-App-Secret"] = appSecret;
        }
      }

      const userToken = this.auth.getToken();
      if (userToken) {
        headers["Authorization"] = `Bearer ${userToken}`;
      }

      params.headers = JSON.stringify(headers);

      /* 添加请求数据 */
      if (data) {
        params.body = JSON.stringify(data);
      }

      /* 构建查询字符串 */
      const query_string = Object.keys(params)
        .map(
          (key) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
        )
        .join("&");

      /* 完整的JSONP URL */
      const jsonp_url = `${url}?${query_string}`;

      console.log(`[WordGate] 请求: ${method} ${endpoint}`);

      /* 设置超时 */
      const timeout_id = setTimeout(() => {
        cleanup();
        reject(new Error("请求超时"));
      }, 30000);

      /* 清理资源 */
      const cleanup = () => {
        clearTimeout(timeout_id);
        const script_element = document.getElementById(callback_name);
        if (script_element && script_element.parentNode) {
          script_element.parentNode.removeChild(script_element);
        }
        delete window[callback_name];
      };

      /* 设置全局回调函数 */
      window[callback_name] = (response) => {
        /* 清理资源 */
        cleanup();

        if (!response || typeof response !== "object") {
          reject(new Error("无效的JSONP响应格式"));
          return;
        }

        const { status, contentType, body } = response;

        console.log(`[WordGate] 响应状态: ${status}`);
        console.log(
          `[WordGate] 请求完成，耗时: ${(
            performance.now() - start_time
          ).toFixed(2)}ms`
        );

        /* 检查HTTP状态码 */
        if (status >= 200 && status < 300) {
          if (contentType.includes("application/json")) {
            try {
              /* 解析JSON對象 - 处理嵌套的body结构 */
              let jsonResponse =
                typeof body === "object" ? body : JSON.parse(body);

              const { code, message, data } = jsonResponse;
              if (code === 0) {
                resolve(jsonResponse);
              } else {
                // 处理401未登录错误，清除token
                if (code === 401) {
                  console.log("[WordGate] 检测到登录态失效，清除token");
                  this.auth.logout();
                }
                const err = new Error(message || this.code_message(code));
                err.code = code;
                reject(err);
              }
            } catch (e) {
              console.error(`[WordGate] 解析JSON响应失败:`, e);
              // 当解析失败时，将原始内容作为成功响应返回
              resolve(body);
            }
          } else {
            // 非JSON格式响应
            resolve(body);
          }
        } else {
          // 错误状态码
          try {
            const jsonError =
              typeof body === "object" ? body : JSON.parse(body);
            reject(new Error(jsonError?.message || `HTTP错误: ${status}`));
          } catch (e) {
            reject(new Error(`HTTP错误: ${status} - ${body}`));
          }
        }
      };

      /* 创建script标签 */
      const script = document.createElement("script");
      script.id = callback_name;
      script.src = jsonp_url;
      script.onerror = (error) => {
        cleanup();
        reject(new Error("请求失败"));
      };

      /* 添加script标签到文档 */
      document.body.appendChild(script);
    });
  }

  /**
   * 工具方法
   */
  _trigger_event(event_name, data) {
    const event = new CustomEvent("wordgate:" + event_name, {
      detail: data,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }

}

/**
 * 直接初始化 WordGate 实例
 */
(function () {
  // 配置对象 - 由模板填充
  window.wordgate_config = window.wordgate_config || {};
  //console.log("[WordGate] 初始化中...");

  // 创建实例并直接赋值给 window.$wg
  window.$wg = new WordGate({
    base_url: window.wordgate_config.base_url,
    app_code: window.wordgate_config.app_code,
  });
})();
