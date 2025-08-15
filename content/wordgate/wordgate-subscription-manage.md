---
title: 订阅管理
date: 2024-01-01T00:00:00Z
layout: wordgate
---

{{< wordgate-auth-required >}}

<div id="subscription-manage">
  <div class="pure-g">
    <div class="pure-u-1">
      <h2>订阅管理</h2>
      
      <div id="subscription-loading" class="wordgate-loading">
        <p>正在加载订阅信息...</p>
      </div>

      <div id="subscription-content" style="display: none;">
        <div id="no-subscription" style="display: none;" class="subscription-empty">
          <div class="empty-state">
            <h3>您还没有有效的订阅</h3>
            <p>订阅会员享受持续的专属服务</p>
            <a href="/wordgate/wordgate-membership-tiers/" class="pure-button pure-button-primary">
              订阅会员
            </a>
          </div>
        </div>

        <div id="subscription-info" style="display: none;" class="subscription-card">
          <div class="subscription-header">
            <div class="subscription-main">
              <h3 id="subscription-tier-name"></h3>
              <div id="subscription-status" class="status-badge"></div>
            </div>
            <div class="subscription-id">
              <small>订阅ID: <span id="subscription-id-value"></span></small>
            </div>
          </div>
          
          <div class="subscription-details">
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>会员等级:</label>
                  <span id="subscription-tier-code"></span>
                </div>
                <div class="detail-item">
                  <label>计费周期:</label>
                  <span id="subscription-period"></span>
                </div>
                <div class="detail-item">
                  <label>开始时间:</label>
                  <span id="subscription-start-date"></span>
                </div>
                <div class="detail-item">
                  <label>到期时间:</label>
                  <span id="subscription-end-date"></span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>自动续费设置</h4>
              <div class="auto-renew-section">
                <div class="auto-renew-status">
                  <span class="toggle-label">自动续费:</span>
                  <label class="switch">
                    <input type="checkbox" id="auto-renew-toggle">
                    <span class="slider"></span>
                  </label>
                  <span id="auto-renew-status-text"></span>
                </div>
                <div id="next-billing-info" class="next-billing">
                  <small>下次扣费时间: <span id="next-billing-date"></span></small>
                </div>
              </div>
            </div>

            <div class="detail-section" id="order-section">
              <h4>关联订单</h4>
              <div class="order-info">
                <span>订单号: </span>
                <a id="order-link" href="#" target="_blank"></a>
              </div>
            </div>
          </div>

          <div class="subscription-actions">
            <button id="cancel-subscription-btn" class="pure-button button-warning">
              取消订阅
            </button>
            <a href="/wordgate/wordgate-membership-tiers/" class="pure-button">
              升级会员
            </a>
          </div>
        </div>
      </div>

      <div id="subscription-error" style="display: none;" class="wordgate-error">
        <p>加载订阅信息失败，请稍后重试。</p>
        <button class="pure-button" onclick="location.reload()">重试</button>
      </div>
    </div>
  </div>
</div>

<!-- 取消订阅确认模态框 -->
<div id="cancel-modal" class="modal" style="display: none;">
  <div class="modal-content">
    <div class="modal-header">
      <h3>确认取消订阅</h3>
      <span class="modal-close">&times;</span>
    </div>
    <div class="modal-body">
      <p>取消订阅后，您的会员权益将在当前计费周期结束后失效。</p>
      <p><strong>您确定要取消订阅吗？</strong></p>
    </div>
    <div class="modal-footer">
      <button id="confirm-cancel-btn" class="pure-button pure-button-primary button-warning">
        确认取消
      </button>
      <button class="pure-button modal-close-btn">
        取消
      </button>
    </div>
  </div>
</div>

<script>
document.addEventListener('alpine:init', () => {
  Alpine.data('subscriptionManage', () => ({
    loading: true,
    error: false,
    subscription: null,

    async init() {
      await this.loadSubscription();
      this.bindEvents();
    },

    async loadSubscription() {
      try {
        const response = await wg.api.get('/api/membership/subscription');
        if (response.code === 0) {
          this.subscription = response.data;
          this.loading = false;
          this.renderSubscription();
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error('加载订阅信息失败:', error);
        this.error = true;
        this.loading = false;
        this.showError();
      }
    },

    renderSubscription() {
      const loadingEl = document.getElementById('subscription-loading');
      const contentEl = document.getElementById('subscription-content');
      
      loadingEl.style.display = 'none';
      contentEl.style.display = 'block';

      if (!this.subscription) {
        document.getElementById('no-subscription').style.display = 'block';
        return;
      }

      // 显示订阅信息
      document.getElementById('subscription-info').style.display = 'block';
      document.getElementById('subscription-tier-name').textContent = this.subscription.tier_name;
      document.getElementById('subscription-tier-code').textContent = this.subscription.tier_code;
      document.getElementById('subscription-period').textContent = this.getPeriodText(this.subscription.period_type);
      document.getElementById('subscription-start-date').textContent = this.formatDate(this.subscription.start_date);
      document.getElementById('subscription-end-date').textContent = this.formatDate(this.subscription.end_date);
      
      if (this.subscription.subscription_id) {
        document.getElementById('subscription-id-value').textContent = this.subscription.subscription_id;
      }

      // 设置状态
      const statusEl = document.getElementById('subscription-status');
      const statusText = this.getStatusText(this.subscription.status);
      const statusClass = this.getStatusClass(this.subscription.status);
      statusEl.textContent = statusText;
      statusEl.className = `status-badge ${statusClass}`;

      // 设置自动续费状态
      const autoRenewToggle = document.getElementById('auto-renew-toggle');
      const autoRenewText = document.getElementById('auto-renew-status-text');
      autoRenewToggle.checked = this.subscription.auto_renew;
      autoRenewText.textContent = this.subscription.auto_renew ? '已开启' : '已关闭';

      // 显示下次扣费时间
      const nextBillingInfo = document.getElementById('next-billing-info');
      const nextBillingDate = document.getElementById('next-billing-date');
      if (this.subscription.next_billing_date && this.subscription.auto_renew) {
        nextBillingDate.textContent = this.formatDate(this.subscription.next_billing_date);
        nextBillingInfo.style.display = 'block';
      } else {
        nextBillingInfo.style.display = 'none';
      }

      // 设置订单链接
      if (this.subscription.order_no) {
        const orderLink = document.getElementById('order-link');
        orderLink.textContent = this.subscription.order_no;
        orderLink.href = `/wordgate/wordgate-orders/?order_no=${this.subscription.order_no}`;
      } else {
        document.getElementById('order-section').style.display = 'none';
      }
    },

    bindEvents() {
      // 自动续费切换
      document.getElementById('auto-renew-toggle').addEventListener('change', (e) => {
        this.updateAutoRenew(e.target.checked);
      });

      // 取消订阅
      document.getElementById('cancel-subscription-btn').addEventListener('click', () => {
        this.showCancelModal();
      });

      // 模态框事件
      const modal = document.getElementById('cancel-modal');
      const closeElements = modal.querySelectorAll('.modal-close, .modal-close-btn');
      closeElements.forEach(el => {
        el.addEventListener('click', () => this.hideCancelModal());
      });

      document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
        this.cancelSubscription();
      });

      // 点击模态框外部关闭
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideCancelModal();
        }
      });
    },

    async updateAutoRenew(autoRenew) {
      try {
        const response = await wg.api.put('/api/membership/subscription/auto-renew', {
          auto_renew: autoRenew
        });

        if (response.code === 0) {
          const autoRenewText = document.getElementById('auto-renew-status-text');
          autoRenewText.textContent = autoRenew ? '已开启' : '已关闭';
          
          const nextBillingInfo = document.getElementById('next-billing-info');
          if (autoRenew && this.subscription.next_billing_date) {
            nextBillingInfo.style.display = 'block';
          } else {
            nextBillingInfo.style.display = 'none';
          }

          alert(response.data.message || '设置已更新');
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error('更新自动续费设置失败:', error);
        alert('更新设置失败，请稍后重试');
        // 恢复开关状态
        document.getElementById('auto-renew-toggle').checked = !autoRenew;
      }
    },

    showCancelModal() {
      document.getElementById('cancel-modal').style.display = 'block';
    },

    hideCancelModal() {
      document.getElementById('cancel-modal').style.display = 'none';
    },

    async cancelSubscription() {
      try {
        const response = await wg.api.post('/api/membership/subscription/cancel');
        
        if (response.code === 0) {
          alert(response.data.message || '订阅已取消');
          this.hideCancelModal();
          // 重新加载页面数据
          await this.loadSubscription();
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error('取消订阅失败:', error);
        alert('取消订阅失败，请稍后重试');
      }
    },

    showError() {
      document.getElementById('subscription-loading').style.display = 'none';
      document.getElementById('subscription-error').style.display = 'block';
    },

    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    getPeriodText(periodType) {
      switch (periodType) {
        case 'monthly': return '按月';
        case 'quarterly': return '按季';
        case 'yearly': return '按年';
        default: return periodType;
      }
    },

    getStatusText(status) {
      switch (status) {
        case 'active': return '有效';
        case 'expired': return '已过期';
        case 'cancelled': return '已取消';
        case 'pending': return '待生效';
        default: return status;
      }
    },

    getStatusClass(status) {
      switch (status) {
        case 'active': return 'status-active';
        case 'expired': return 'status-expired';
        case 'cancelled': return 'status-cancelled';
        case 'pending': return 'status-pending';
        default: return '';
      }
    }
  }))
});

// 使用Alpine.js
document.addEventListener('DOMContentLoaded', function() {
  const app = document.getElementById('subscription-manage');
  app.setAttribute('x-data', 'subscriptionManage()');
  app.setAttribute('x-init', 'init()');
});
</script>

<style>
.subscription-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  margin-top: 20px;
}

.subscription-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.subscription-main h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 20px;
}

.subscription-id {
  color: #999;
  font-size: 12px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background: #d4edda;
  color: #155724;
}

.status-expired {
  background: #f8d7da;
  color: #721c24;
}

.status-cancelled {
  background: #d1ecf1;
  color: #0c5460;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.subscription-details {
  margin-bottom: 24px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.detail-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.detail-item label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.detail-item span {
  color: #333;
  text-align: right;
}

.auto-renew-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.auto-renew-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-label {
  font-weight: 500;
  color: #666;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #0078e7;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.next-billing {
  color: #666;
  font-size: 14px;
  margin-left: 62px;
}

.order-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-info a {
  color: #0078e7;
  text-decoration: none;
}

.order-info a:hover {
  text-decoration: underline;
}

.subscription-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.button-warning {
  background-color: #dc3545;
  color: white;
}

.button-warning:hover {
  background-color: #c82333;
}

.subscription-empty {
  text-align: center;
  padding: 60px 20px;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  color: #666;
}

.empty-state p {
  color: #999;
  margin: 0 0 24px 0;
}

.wordgate-loading, .wordgate-error {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.wordgate-error {
  color: #e74c3c;
}

/* 模态框样式 */
.modal {
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

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90%;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.modal-close {
  color: #999;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  line-height: 1;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media screen and (max-width: 600px) {
  .subscription-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .detail-item span {
    text-align: left;
  }

  .subscription-actions {
    flex-direction: column;
  }

  .auto-renew-status {
    flex-wrap: wrap;
    gap: 8px;
  }

  .next-billing {
    margin-left: 0;
  }
}
</style>