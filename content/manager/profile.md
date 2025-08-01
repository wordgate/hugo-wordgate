---
title: "应用信息"
description: "管理应用的基本信息，包括名称、描述等"
layout: "manager"
---

<div x-data="profileManager()" x-init="init()">
  <!-- 加载状态 -->
  <div x-show="loading" class="alert" style="background-color: #f8f9fa; border-color: #dee2e6;">
    正在加载应用信息...
  </div>

  <!-- 错误提示 -->
  <div x-show="error" x-text="error" class="alert alert-danger"></div>

  <!-- 成功提示 -->
  <div x-show="success" x-text="success" class="alert alert-success"></div>

  <!-- 应用信息表单 -->
  <div x-show="!loading" style="background: #fff; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <form @submit.prevent="saveProfile()">
      <!-- 基本信息 -->
      <div style="margin-bottom: 2rem;">
        <h4 style="margin: 0 0 1rem 0; color: #495057; border-bottom: 2px solid #007bff; padding-bottom: 0.5rem;">基本信息</h4>
        
        <div class="form-group">
          <label>应用代码</label>
          <input type="text" x-model="profile.code" class="form-control" readonly style="background-color: #f8f9fa;">
          <small style="color: #6c757d;">应用代码不可修改</small>
        </div>
        
        <div class="form-group">
          <label>应用名称 *</label>
          <input type="text" x-model="profile.name" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label>应用描述</label>
          <textarea x-model="profile.description" class="form-control" rows="3" placeholder="应用的简短描述"></textarea>
        </div>
        
        <div class="form-group">
          <label>官方网站</label>
          <input type="url" x-model="profile.website" class="form-control" placeholder="https://example.com">
        </div>
      </div>

      <!-- 应用状态信息 -->
      <div style="margin-bottom: 2rem;">
        <h4 style="margin: 0 0 1rem 0; color: #495057; border-bottom: 2px solid #007bff; padding-bottom: 0.5rem;">状态信息</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label>应用状态</label>
            <div style="padding: 0.75rem; background-color: #f8f9fa; border-radius: 0.35rem;">
              <span x-show="profile.status === 'active'" style="color: #28a745; font-weight: bold;">✓ 正常运行</span>
              <span x-show="profile.status !== 'active'" style="color: #dc3545; font-weight: bold;">✗ 已停用</span>
            </div>
          </div>
          
          <div class="form-group">
            <label>创建时间</label>
            <div style="padding: 0.75rem; background-color: #f8f9fa; border-radius: 0.35rem;" x-text="profile.created_at ? window.$wg.helper.formatDate(profile.created_at) : '-'">
            </div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label>用户总数</label>
            <div style="padding: 0.75rem; background-color: #f8f9fa; border-radius: 0.35rem;" x-text="stats.users || 0">
            </div>
          </div>
          
          <div class="form-group">
            <label>订单总数</label>
            <div style="padding: 0.75rem; background-color: #f8f9fa; border-radius: 0.35rem;" x-text="stats.orders || 0">
            </div>
          </div>
        </div>
      </div>

      <!-- API 密钥信息 -->
      <div style="margin-bottom: 2rem;">
        <h4 style="margin: 0 0 1rem 0; color: #495057; border-bottom: 2px solid #007bff; padding-bottom: 0.5rem;">API 信息</h4>
        
        <div class="form-group">
          <label>应用代码 (App Code)</label>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <input type="text" :value="profile.code" class="form-control" readonly style="background-color: #f8f9fa;">
            <button type="button" @click="copyToClipboard(profile.code)" class="btn btn-sm" style="background: #f8f9fa; border: 1px solid #dee2e6;">
              📋 复制
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label>API 密钥 (App Secret)</label>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <input type="password" x-model="apiSecret" class="form-control" readonly style="background-color: #f8f9fa;" placeholder="点击显示查看">
            <button type="button" @click="toggleSecretVisible()" class="btn btn-sm" style="background: #f8f9fa; border: 1px solid #dee2e6;">
              <span x-show="!secretVisible">👁️ 显示</span>
              <span x-show="secretVisible">🙈 隐藏</span>
            </button>
            <button type="button" @click="copyToClipboard(apiSecret)" class="btn btn-sm" style="background: #f8f9fa; border: 1px solid #dee2e6;">
              📋 复制
            </button>
          </div>
          <small style="color: #dc3545;">⚠️ 请妥善保管 API 密钥，不要泄露给他人</small>
        </div>
      </div>

      <!-- 保存按钮 -->
      <div style="text-align: right;">
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          <span x-show="!submitting">💾 保存信息</span>
          <span x-show="submitting">保存中...</span>
        </button>
      </div>
    </form>
  </div>
</div>

<script>
function profileManager() {
  return {
    loading: false,
    error: '',
    success: '',
    submitting: false,
    secretVisible: false,
    profile: {
      code: '',
      name: '',
      description: '',
      website: '',
      status: '',
      created_at: ''
    },
    stats: {
      users: 0,
      orders: 0
    },
    apiSecret: '',

    async init() {
      await this.loadProfile();
      await this.loadStats();
    },

    async loadProfile() {
      this.loading = true;
      this.error = '';
      
      try {
        const response = await window.$wg.with('manager').profile.get();
        
        if (response.data) {
          this.profile = {
            code: response.data.code || '',
            name: response.data.name || '',
            description: response.data.description || '',
            website: response.data.website || '',
            status: response.data.status || 'active',
            created_at: response.data.created_at || ''
          };
          
          // 获取 API 密钥（通常会加密返回）
          this.apiSecret = response.data.app_secret || '';
        }
      } catch (error) {
        this.error = '加载应用信息失败: ' + error.message;
        console.error('Load profile error:', error);
      } finally {
        this.loading = false;
      }
    },

    async loadStats() {
      try {
        // 加载用户统计
        const usersResponse = await window.$wg.with('manager').users.list({ page: 1, per_page: 1 });
        if (usersResponse.data && usersResponse.data.pagination) {
          this.stats.users = usersResponse.data.pagination.total || 0;
        }
        
        // 加载订单统计
        const ordersResponse = await window.$wg.with('manager').orders.list({ page: 1, per_page: 1 });
        if (ordersResponse.data && ordersResponse.data.pagination) {
          this.stats.orders = ordersResponse.data.pagination.total || 0;
        }
      } catch (error) {
        console.error('Load stats error:', error);
      }
    },

    async saveProfile() {
      this.submitting = true;
      this.error = '';
      this.success = '';
      
      try {
        const profileData = {
          name: this.profile.name,
          description: this.profile.description,
          website: this.profile.website
        };
        
        await window.$wg.with('manager').profile.update(profileData);
        
        this.success = '应用信息保存成功！';
        setTimeout(() => { this.success = ''; }, 3000);
        
      } catch (error) {
        this.error = '保存应用信息失败: ' + error.message;
        console.error('Save profile error:', error);
      } finally {
        this.submitting = false;
      }
    },

    toggleSecretVisible() {
      this.secretVisible = !this.secretVisible;
      const input = document.querySelector('input[x-model="apiSecret"]');
      if (input) {
        input.type = this.secretVisible ? 'text' : 'password';
      }
    },

    copyToClipboard(text) {
      if (!text) {
        alert('没有可复制的内容');
        return;
      }
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.showMessage('已复制到剪贴板', 'success');
        }).catch(() => {
          this.fallbackCopyTextToClipboard(text);
        });
      } else {
        this.fallbackCopyTextToClipboard(text);
      }
    },

    fallbackCopyTextToClipboard(text) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        this.showMessage('已复制到剪贴板', 'success');
      } catch (err) {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
      }
      
      document.body.removeChild(textArea);
    },

    showMessage(message, type) {
      if (type === 'success') {
        this.success = message;
        setTimeout(() => { this.success = ''; }, 2000);
      } else {
        this.error = message;
        setTimeout(() => { this.error = ''; }, 3000);
      }
    }
  }
}
</script>