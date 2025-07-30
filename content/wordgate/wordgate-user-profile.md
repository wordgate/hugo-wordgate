---
title: "用户中心"
type: "wordgate"
layout: "wordgate"
url: "/profile/"
---

<div class="wordgate-container">
  <!-- 需要登录 -->
  {{< wordgate-auth-required >}}
  
  <div class="user-profile-page">
    <!-- 用户信息卡片 -->
    <div class="user-info-card">
      <div class="pure-g">
        <div class="pure-u-1 pure-u-md-1-3">
          <div class="user-avatar">
            <div class="avatar-placeholder">👤</div>
          </div>
        </div>
        <div class="pure-u-1 pure-u-md-2-3">
          <div class="user-details" x-data="userProfileData()" x-init="loadUserInfo()">
            <h2 class="user-name" x-text="user.nickname || 'User'">加载中...</h2>
            <p class="user-email" x-text="user.email || ''"></p>
            <div class="user-actions">
              <a href="/profile/edit" class="pure-button pure-button-primary">编辑资料</a>
              <a href="/profile/password" class="pure-button">修改密码</a>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 地址管理 -->
    <div class="address-management-section">
      {{ partial "wordgate-address-list.html" (dict "mode" "manage") }}
    </div>
    
    <!-- 其他功能区域 -->
    <div class="other-sections">
      <div class="pure-g">
        <div class="pure-u-1 pure-u-md-1-2">
          <div class="section-card">
            <h3>订单管理</h3>
            <p>查看和管理您的订单</p>
            <a href="/orders/" class="pure-button">查看订单</a>
          </div>
        </div>
        <div class="pure-u-1 pure-u-md-1-2">
          <div class="section-card">
            <h3>会员中心</h3>
            <p>查看会员权益和等级</p>
            <a href="/membership/" class="pure-button">会员中心</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  {{< /wordgate-auth-required >}}
</div>

<script>
function userProfileData() {
  return {
    user: {},
    
    async loadUserInfo() {
      try {
        // 从本地存储获取用户信息
        this.user = $wg.user.getProfile();
        
        // 如果本地没有，尝试从服务器获取
        if (!this.user.id) {
          const {code, message, data} = await $wg.with('user').get_profile();
          this.user = data || {};
          $wg.user.setProfile(this.user);
        }
        
        console.log('[UserProfile] 用户信息:', this.user);
      } catch (error) {
        console.error('[UserProfile] 加载用户信息失败:', error);
      }
    }
  };
}
</script>

<style>
/* 用户中心页面样式 */
.user-profile-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.user-info-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
}

.user-avatar {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  background-color: #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #718096;
}

.user-details {
  padding-left: 2rem;
}

.user-name {
  margin: 0 0 0.5rem;
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
}

.user-email {
  margin: 0 0 1.5rem;
  color: #718096;
  font-size: 1rem;
}

.user-actions {
  display: flex;
  gap: 1rem;
}

.address-management-section {
  margin-bottom: 2rem;
}

.other-sections {
  margin-top: 2rem;
}

.section-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 1rem;
  text-align: center;
}

.section-card h3 {
  margin: 0 0 1rem;
  color: #2d3748;
  font-size: 1.2rem;
  font-weight: 600;
}

.section-card p {
  margin: 0 0 1.5rem;
  color: #718096;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-profile-page {
    padding: 1rem 0.5rem;
  }
  
  .user-info-card {
    padding: 1.5rem;
  }
  
  .user-details {
    padding-left: 0;
    margin-top: 1rem;
    text-align: center;
  }
  
  .user-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .section-card {
    padding: 1.5rem;
  }
}
</style> 