---
title: 会员等级
date: 2024-01-01T00:00:00Z
layout: wordgate
---

<div id="membership-tiers">
  <div class="pure-g">
    <div class="pure-u-1">
      <h2>选择您的会员等级</h2>
      <div id="tiers-loading" class="wordgate-loading">
        <p>正在加载会员等级信息...</p>
      </div>
      <div id="tiers-list" style="display: none;" class="membership-tiers">
        <!-- 会员等级将通过JavaScript动态加载 -->
      </div>
      <div id="tiers-error" style="display: none;" class="wordgate-error">
        <p>加载会员等级信息失败，请稍后重试。</p>
      </div>
    </div>
  </div>
</div>

<script>
document.addEventListener('alpine:init', () => {
  Alpine.data('membershipTiers', () => ({
    loading: true,
    error: false,
    tiers: [],

    async init() {
      await this.loadTiers();
    },

    async loadTiers() {
      try {
        const response = await wg.api.get('/api/membership/tiers');
        if (response.code === 0) {
          this.tiers = response.data || [];
          this.loading = false;
          this.renderTiers();
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error('加载会员等级失败:', error);
        this.error = true;
        this.loading = false;
        this.showError();
      }
    },

    renderTiers() {
      const container = document.getElementById('tiers-list');
      const loadingEl = document.getElementById('tiers-loading');
      
      if (this.tiers.length === 0) {
        container.innerHTML = '<p class="wordgate-empty">暂无会员等级</p>';
      } else {
        container.innerHTML = this.tiers.map(tier => `
          <div class="membership-tier-card ${tier.is_default ? 'default-tier' : ''}">
            <div class="tier-header">
              <h3>${tier.name}</h3>
              <span class="tier-level">等级 ${tier.level}</span>
              ${tier.is_default ? '<span class="default-badge">默认</span>' : ''}
            </div>
            <div class="tier-prices">
              ${tier.prices.map(price => `
                <div class="price-option">
                  <div class="period">${this.getPeriodText(price.period_type, price.months)}</div>
                  <div class="price">
                    <span class="current-price">¥${(price.price / 100).toFixed(2)}</span>
                    ${price.original_price !== price.price ? 
                      `<span class="original-price">¥${(price.original_price / 100).toFixed(2)}</span>` : 
                      ''
                    }
                  </div>
                  <button class="pure-button pure-button-primary subscribe-btn"
                          onclick="this.purchaseSubscription('${tier.id}', '${price.period_type}')">
                    订阅
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('');
      }

      loadingEl.style.display = 'none';
      container.style.display = 'block';
    },

    showError() {
      document.getElementById('tiers-loading').style.display = 'none';
      document.getElementById('tiers-error').style.display = 'block';
    },

    getPeriodText(periodType, months) {
      switch (periodType) {
        case 'monthly': return '月付';
        case 'quarterly': return '季付';
        case 'yearly': return '年付';
        case 'custom': return `${months}个月`;
        default: return periodType;
      }
    },

    async purchaseSubscription(tierId, periodType) {
      if (!wg.auth.isLogin()) {
        wg.auth.showLoginModal();
        return;
      }

      // 显示支付方式选择对话框
      this.showPaymentMethodDialog(tierId, periodType);
    },

    async showPaymentMethodDialog(tierId, periodType) {
      try {
        // 获取可用的支付方式
        const response = await wg.api.get('/api/payment/methods');
        if (response.code === 0) {
          const methods = response.data || [];
          const supportedMethods = methods.filter(m => m.supports_subscription);
          const unsupportedMethods = methods.filter(m => !m.supports_subscription);
          
          // 构建支付方式选择HTML
          let methodsHtml = '<div class="payment-methods">';
          
          if (supportedMethods.length > 0) {
            methodsHtml += '<h4>推荐支付方式（支持自动续费）</h4>';
            supportedMethods.forEach(method => {
              methodsHtml += `
                <div class="payment-method-item supported" data-method="${method.id}">
                  <img src="${method.icon}" alt="${method.name}" class="payment-icon">
                  <span class="method-name">${method.name}</span>
                  <span class="subscription-badge">自动续费</span>
                </div>`;
            });
          }

          if (unsupportedMethods.length > 0) {
            methodsHtml += '<h4>其他支付方式（一次性付款）</h4>';
            unsupportedMethods.forEach(method => {
              methodsHtml += `
                <div class="payment-method-item unsupported" data-method="${method.id}">
                  <img src="${method.icon}" alt="${method.name}" class="payment-icon">
                  <span class="method-name">${method.name}</span>
                  <span class="one-time-badge">一次性</span>
                </div>`;
            });
          }
          
          methodsHtml += '</div>';
          
          // 显示模态框
          const modal = document.createElement('div');
          modal.className = 'payment-method-modal';
          modal.innerHTML = `
            <div class="modal-content">
              <div class="modal-header">
                <h3>选择支付方式</h3>
                <span class="modal-close">&times;</span>
              </div>
              <div class="modal-body">
                ${methodsHtml}
                <div class="subscription-note">
                  <p><strong>说明：</strong></p>
                  <p>• <span class="supported-text">支持自动续费</span>的支付方式会在到期前自动续费</p>
                  <p>• <span class="unsupported-text">一次性付款</span>的支付方式需要手动续费</p>
                </div>
              </div>
            </div>`;
          
          document.body.appendChild(modal);
          
          // 绑定事件
          modal.querySelector('.modal-close').onclick = () => {
            document.body.removeChild(modal);
          };
          
          modal.onclick = (e) => {
            if (e.target === modal) {
              document.body.removeChild(modal);
            }
          };
          
          // 支付方式选择事件
          modal.querySelectorAll('.payment-method-item').forEach(item => {
            item.onclick = () => {
              const methodId = item.dataset.method;
              document.body.removeChild(modal);
              this.createSubscriptionOrder(tierId, periodType, methodId);
            };
          });
        }
      } catch (error) {
        console.error('获取支付方式失败:', error);
        alert('获取支付方式失败，请稍后重试');
      }
    },

    async createSubscriptionOrder(tierId, periodType, paymentMethod) {
      try {
        const response = await $wg.with('orders').createMembership({
          tier_id: parseInt(tierId),
          period_type: periodType
        });

        if (response.code === 0) {
          const order = response.data;
          // 跳转到支付页面
          window.location.href = order.pay_url;
        } else {
          alert('创建订单失败: ' + response.message);
        }
      } catch (error) {
        console.error('购买会员失败:', error);
        alert('购买失败，请稍后重试');
      }
    }
  }))
});

// 使用Alpine.js
document.addEventListener('DOMContentLoaded', function() {
  const app = document.getElementById('membership-tiers');
  app.setAttribute('x-data', 'membershipTiers()');
  app.setAttribute('x-init', 'init()');
});
</script>

<style>
.membership-tiers {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
}

.membership-tier-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  flex: 1;
  min-width: 280px;
  max-width: 350px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.membership-tier-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.membership-tier-card.default-tier {
  border-color: #0078e7;
  background: linear-gradient(135deg, #f8fbff 0%, #fff 100%);
}

.tier-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.tier-header h3 {
  margin: 0;
  color: #333;
}

.tier-level {
  background: #f0f0f0;
  color: #666;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.default-badge {
  background: #0078e7;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.tier-prices {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.price-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.period {
  font-weight: 500;
  color: #333;
}

.price {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.current-price {
  font-weight: bold;
  font-size: 18px;
  color: #0078e7;
}

.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

.subscribe-btn {
  min-width: 80px;
  background: #0078e7;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.subscribe-btn:hover {
  background: #005bb5;
}

.wordgate-loading, .wordgate-error, .wordgate-empty {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.wordgate-error {
  color: #e74c3c;
}

/* 支付方式模态框样式 */
.payment-method-modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-method-modal .modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90%;
  overflow-y: auto;
}

.payment-method-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.payment-method-modal .modal-header h3 {
  margin: 0;
  color: #333;
}

.payment-method-modal .modal-close {
  color: #999;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  line-height: 1;
}

.payment-method-modal .modal-close:hover {
  color: #333;
}

.payment-method-modal .modal-body {
  padding: 20px;
}

.payment-method-modal h4 {
  margin: 20px 0 12px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.payment-method-modal h4:first-child {
  margin-top: 0;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.payment-method-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  gap: 12px;
}

.payment-method-item:hover {
  border-color: #0078e7;
  background-color: #f8fbff;
}

.payment-method-item.supported {
  border-color: #28a745;
}

.payment-method-item.supported:hover {
  border-color: #1e7e34;
  background-color: #f8fff9;
}

.payment-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.method-name {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.subscription-badge {
  background: #28a745;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.one-time-badge {
  background: #ffc107;
  color: #333;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.subscription-note {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #0078e7;
}

.subscription-note p {
  margin: 0 0 8px 0;
  font-size: 13px;
  line-height: 1.4;
}

.subscription-note p:last-child {
  margin-bottom: 0;
}

.supported-text {
  color: #28a745;
  font-weight: 500;
}

.unsupported-text {
  color: #ffc107;
  font-weight: 500;
}

@media screen and (max-width: 600px) {
  .payment-method-modal .modal-content {
    width: 95%;
    margin: 10px;
  }
  
  .payment-method-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    text-align: center;
  }
  
  .payment-icon {
    align-self: center;
  }
}
</style>