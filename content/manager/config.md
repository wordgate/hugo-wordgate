---
title: "应用配置"
description: "管理应用的基础配置，包括支付设置、邮件配置等"
layout: "manager"
---

<div x-data="configManager()" x-init="init()">
  <!-- 加载状态 -->
  <div x-show="loading" class="alert" style="background-color: #f8f9fa; border-color: #dee2e6;">
    正在加载配置信息...
  </div>

  <!-- 错误提示 -->
  <div x-show="error" x-text="error" class="alert alert-danger"></div>

  <!-- 成功提示 -->
  <div x-show="success" x-text="success" class="alert alert-success"></div>

  <!-- 配置表单 -->
  <div x-show="!loading" style="background: #fff; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <form @submit.prevent="saveConfig()">
      <!-- 基础设置 -->
      <div style="margin-bottom: 2rem;">
        <h4 style="margin: 0 0 1rem 0; color: #495057; border-bottom: 2px solid #007bff; padding-bottom: 0.5rem;">基础设置</h4>
        
        <div class="form-group">
          <label>应用名称 *</label>
          <input type="text" x-model="config.app_name" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label>货币类型</label>
          <select x-model="config.currency" class="form-control">
            <option value="CNY">人民币 (CNY)</option>
            <option value="USD">美元 (USD)</option>
            <option value="EUR">欧元 (EUR)</option>
            <option value="JPY">日元 (JPY)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>应用描述</label>
          <textarea x-model="config.app_description" class="form-control" rows="3" placeholder="应用的简短描述"></textarea>
        </div>
      </div>

      <!-- 邮件设置 -->
      <div style="margin-bottom: 2rem;">
        <h4 style="margin: 0 0 1rem 0; color: #495057; border-bottom: 2px solid #007bff; padding-bottom: 0.5rem;">邮件设置</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label>SMTP 服务器</label>
            <input type="text" x-model="config.smtp_host" class="form-control" placeholder="smtp.example.com">
          </div>
          
          <div class="form-group">
            <label>SMTP 端口</label>
            <input type="number" x-model="config.smtp_port" class="form-control" placeholder="587">
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label>邮箱用户名</label>
            <input type="email" x-model="config.smtp_username" class="form-control" placeholder="noreply@example.com">
          </div>
          
          <div class="form-group">
            <label>邮箱密码</label>
            <input type="password" x-model="config.smtp_password" class="form-control" placeholder="••••••••">
          </div>
        </div>
        
        <div class="form-group">
          <label>发件人名称</label>
          <input type="text" x-model="config.smtp_from_name" class="form-control" placeholder="WordGate">
        </div>
      </div>

      <!-- 支付设置 -->
      <div style="margin-bottom: 2rem;">
        <h4 style="margin: 0 0 1rem 0; color: #495057; border-bottom: 2px solid #007bff; padding-bottom: 0.5rem;">支付设置</h4>
        
        <div class="form-group">
          <label>
            <input type="checkbox" x-model="config.payment_enabled"> 启用支付功能
          </label>
        </div>
        
        <div x-show="config.payment_enabled">
          <div class="form-group">
            <label>Stripe 公钥</label>
            <input type="text" x-model="config.stripe_public_key" class="form-control" placeholder="pk_test_...">
          </div>
          
          <div class="form-group">
            <label>Stripe 私钥</label>
            <input type="password" x-model="config.stripe_secret_key" class="form-control" placeholder="sk_test_...">
          </div>
          
          <div class="form-group">
            <label>支付成功回调URL</label>
            <input type="url" x-model="config.payment_success_url" class="form-control" placeholder="https://example.com/payment/success">
          </div>
          
          <div class="form-group">
            <label>支付取消回调URL</label>
            <input type="url" x-model="config.payment_cancel_url" class="form-control" placeholder="https://example.com/payment/cancel">
          </div>
        </div>
      </div>

      <!-- 安全设置 -->
      <div style="margin-bottom: 2rem;">
        <h4 style="margin: 0 0 1rem 0; color: #495057; border-bottom: 2px solid #007bff; padding-bottom: 0.5rem;">安全设置</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label>验证码过期时间 (秒)</label>
            <input type="number" x-model="config.code_expire" class="form-control" min="60" max="3600" placeholder="600">
          </div>
          
          <div class="form-group">
            <label>JWT 过期时间 (小时)</label>
            <input type="number" x-model="config.jwt_expire_hours" class="form-control" min="1" max="168" placeholder="72">
          </div>
        </div>
        
        <div class="form-group">
          <label>允许的域名 (每行一个)</label>
          <textarea x-model="config.allowed_origins" class="form-control" rows="3" placeholder="https://example.com&#10;https://www.example.com"></textarea>
        </div>
      </div>

      <!-- 保存按钮 -->
      <div style="text-align: right;">
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          <span x-show="!submitting">💾 保存配置</span>
          <span x-show="submitting">保存中...</span>
        </button>
      </div>
    </form>
  </div>
</div>

<script>
function configManager() {
  return {
    loading: false,
    error: '',
    success: '',
    submitting: false,
    config: {
      app_name: '',
      app_description: '',
      currency: 'CNY',
      smtp_host: '',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      smtp_from_name: '',
      payment_enabled: false,
      stripe_public_key: '',
      stripe_secret_key: '',
      payment_success_url: '',
      payment_cancel_url: '',
      code_expire: 600,
      jwt_expire_hours: 72,
      allowed_origins: ''
    },

    async init() {
      await this.loadConfig();
    },

    async loadConfig() {
      this.loading = true;
      this.error = '';
      
      try {
        const response = await window.$wg.with('manager').config.get();
        
        if (response.data) {
          // 映射响应数据到表单
          const data = response.data;
          
          this.config.app_name = data.app?.name || '';
          this.config.app_description = data.app?.description || '';
          this.config.currency = data.app?.currency || 'CNY';
          
          // SMTP 配置
          if (data.smtp) {
            this.config.smtp_host = data.smtp.host || '';
            this.config.smtp_port = data.smtp.port || 587;
            this.config.smtp_username = data.smtp.username || '';
            this.config.smtp_password = data.smtp.password || '';
            this.config.smtp_from_name = data.smtp.from_name || '';
          }
          
          // 支付配置
          if (data.payment) {
            this.config.payment_enabled = data.payment.enabled || false;
            if (data.payment.stripe) {
              this.config.stripe_public_key = data.payment.stripe.public_key || '';
              this.config.stripe_secret_key = data.payment.stripe.secret_key || '';
            }
            this.config.payment_success_url = data.payment.success_url || '';
            this.config.payment_cancel_url = data.payment.cancel_url || '';
          }
          
          // 安全配置
          if (data.security) {
            this.config.code_expire = data.security.code_expire || 600;
            this.config.jwt_expire_hours = data.security.jwt_expire_hours || 72;
          }
          
          // 允许的域名
          if (data.allowed_origins && Array.isArray(data.allowed_origins)) {
            this.config.allowed_origins = data.allowed_origins.join('\n');
          }
        }
      } catch (error) {
        this.error = '加载配置失败: ' + error.message;
        console.error('Load config error:', error);
      } finally {
        this.loading = false;
      }
    },

    async saveConfig() {
      this.submitting = true;
      this.error = '';
      this.success = '';
      
      try {
        // 构建配置数据
        const configData = {
          app: {
            name: this.config.app_name,
            description: this.config.app_description,
            currency: this.config.currency
          },
          smtp: {
            host: this.config.smtp_host,
            port: parseInt(this.config.smtp_port),
            username: this.config.smtp_username,
            password: this.config.smtp_password,
            from_name: this.config.smtp_from_name
          },
          payment: {
            enabled: this.config.payment_enabled,
            stripe: {
              public_key: this.config.stripe_public_key,
              secret_key: this.config.stripe_secret_key
            },
            success_url: this.config.payment_success_url,
            cancel_url: this.config.payment_cancel_url
          },
          security: {
            code_expire: parseInt(this.config.code_expire),
            jwt_expire_hours: parseInt(this.config.jwt_expire_hours)
          },
          allowed_origins: this.config.allowed_origins.split('\n').filter(url => url.trim())
        };
        
        await window.$wg.with('manager').config.update(configData);
        
        this.success = '配置保存成功！';
        setTimeout(() => { this.success = ''; }, 3000);
        
      } catch (error) {
        this.error = '保存配置失败: ' + error.message;
        console.error('Save config error:', error);
      } finally {
        this.submitting = false;
      }
    }
  }
}
</script>