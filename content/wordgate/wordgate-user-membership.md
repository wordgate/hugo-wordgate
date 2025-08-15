---
title: 我的会员
date: 2024-01-01T00:00:00Z
layout: wordgate
---

{{< wordgate-auth-required >}}

<div id="user-membership">
  <div class="pure-g">
    <div class="pure-u-1">
      <h2>我的会员</h2>
      
      <div id="membership-loading" class="wordgate-loading">
        <p>正在加载会员信息...</p>
      </div>

      <div id="membership-content" style="display: none;">
        <div id="no-membership" style="display: none;" class="membership-empty">
          <div class="empty-state">
            <h3>您还不是会员</h3>
            <p>成为会员享受专属权益和优惠</p>
            <a href="/wordgate/wordgate-membership-tiers/" class="pure-button pure-button-primary">
              立即升级会员
            </a>
          </div>
        </div>

        <div id="membership-info" style="display: none;" class="membership-card">
          <div class="membership-header">
            <div class="membership-main">
              <h3 id="tier-name"></h3>
              <div id="membership-status" class="status-badge"></div>
            </div>
            <div class="membership-actions">
              <a href="/wordgate/wordgate-subscription-manage/" class="pure-button">
                管理订阅
              </a>
            </div>
          </div>
          
          <div class="membership-details">
            <div class="detail-item">
              <label>会员等级:</label>
              <span id="tier-code"></span>
            </div>
            <div class="detail-item">
              <label>开始时间:</label>
              <span id="start-date"></span>
            </div>
            <div class="detail-item">
              <label>到期时间:</label>
              <span id="end-date"></span>
            </div>
            <div class="detail-item" id="order-info">
              <label>订单号:</label>
              <span id="order-no"></span>
            </div>
          </div>
        </div>
      </div>

      <div id="membership-error" style="display: none;" class="wordgate-error">
        <p>加载会员信息失败，请稍后重试。</p>
        <button class="pure-button" onclick="location.reload()">重试</button>
      </div>
    </div>
  </div>
</div>

<script>
document.addEventListener('alpine:init', () => {
  Alpine.data('userMembership', () => ({
    loading: true,
    error: false,
    membership: null,

    async init() {
      await this.loadMembership();
    },

    async loadMembership() {
      try {
        const response = await wg.api.get('/api/membership/user');
        if (response.code === 0) {
          this.membership = response.data;
          this.loading = false;
          this.renderMembership();
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error('加载会员信息失败:', error);
        this.error = true;
        this.loading = false;
        this.showError();
      }
    },

    renderMembership() {
      const loadingEl = document.getElementById('membership-loading');
      const contentEl = document.getElementById('membership-content');
      
      loadingEl.style.display = 'none';
      contentEl.style.display = 'block';

      if (!this.membership) {
        document.getElementById('no-membership').style.display = 'block';
        return;
      }

      // 显示会员信息
      document.getElementById('membership-info').style.display = 'block';
      document.getElementById('tier-name').textContent = this.membership.tier_name;
      document.getElementById('tier-code').textContent = this.membership.tier_code;
      document.getElementById('start-date').textContent = this.formatDate(this.membership.start_date);
      document.getElementById('end-date').textContent = this.formatDate(this.membership.end_date);
      
      if (this.membership.order_no) {
        document.getElementById('order-no').textContent = this.membership.order_no;
      } else {
        document.getElementById('order-info').style.display = 'none';
      }

      // 设置状态
      const statusEl = document.getElementById('membership-status');
      const statusText = this.getStatusText(this.membership.status);
      const statusClass = this.getStatusClass(this.membership.status);
      statusEl.textContent = statusText;
      statusEl.className = `status-badge ${statusClass}`;
    },

    showError() {
      document.getElementById('membership-loading').style.display = 'none';
      document.getElementById('membership-error').style.display = 'block';
    },

    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('zh-CN');
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
  const app = document.getElementById('user-membership');
  app.setAttribute('x-data', 'userMembership()');
  app.setAttribute('x-init', 'init()');
});
</script>

<style>
.membership-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  margin-top: 20px;
}

.membership-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.membership-main h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 20px;
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

.membership-details {
  display: grid;
  gap: 12px;
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

.membership-empty {
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

@media screen and (max-width: 600px) {
  .membership-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .detail-item span {
    text-align: left;
  }
}
</style>

{{< /wordgate-auth-required >}}