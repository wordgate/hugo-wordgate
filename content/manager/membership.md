---
title: "会员管理"
description: "管理会员等级和权益，设置会员价格和功能"
layout: "manager"
---

<div x-data="membershipManager()" x-init="init()">
  <!-- 工具栏 -->
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
    <div>
      <label style="margin-right: 1rem;">
        <input type="checkbox" x-model="showDeleted" @change="loadTiers()"> 显示已删除等级
      </label>
    </div>
    <div>
      <button @click="openCreateModal()" class="btn btn-primary">
        ➕ 新增会员等级
      </button>
    </div>
  </div>

  <!-- 加载状态 -->
  <div x-show="loading" class="alert" style="background-color: #f8f9fa; border-color: #dee2e6;">
    正在加载会员等级列表...
  </div>

  <!-- 错误提示 -->
  <div x-show="error" x-text="error" class="alert alert-danger"></div>

  <!-- 会员等级列表 -->
  <div class="table-container">
    <table class="table">
      <thead>
        <tr>
          <th>等级代码</th>
          <th>等级名称</th>
          <th>价格</th>
          <th>有效期(天)</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <template x-for="tier in tiers" :key="tier.id">
          <tr>
            <td x-text="tier.code"></td>
            <td>
              <div style="font-weight: 500;" x-text="tier.name"></div>
              <div x-show="tier.description" style="color: #6c757d; font-size: 0.875rem;" x-text="tier.description"></div>
            </td>
            <td x-text="window.$wg.helper.formatMoney(tier.price)"></td>
            <td>
              <span x-show="tier.duration_days > 0" x-text="tier.duration_days + ' 天'"></span>
              <span x-show="tier.duration_days <= 0" style="color: #28a745; font-weight: bold;">永久</span>
            </td>
            <td>
              <span x-show="tier.deleted_at" style="color: #dc3545;">已删除</span>
              <span x-show="!tier.deleted_at && tier.status === 'active'" style="color: #28a745;">有效</span>
              <span x-show="!tier.deleted_at && tier.status !== 'active'" style="color: #6c757d;">无效</span>
            </td>
            <td x-text="window.$wg.helper.formatDate(tier.created_at)"></td>
            <td>
              <template x-if="tier.deleted_at">
                <button @click="restoreTier(tier.code)" class="btn btn-sm" style="color: #007bff;">
                  恢复
                </button>
              </template>
              <template x-if="!tier.deleted_at">
                <div style="display: flex; gap: 0.5rem;">
                  <button @click="editTier(tier)" class="btn btn-sm" style="color: #007bff;">
                    编辑
                  </button>
                  <button @click="deleteTier(tier.code)" class="btn btn-sm btn-danger">
                    删除
                  </button>
                </div>
              </template>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>

  <!-- 分页 -->
  <div x-show="pagination.total > 0" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
    <div>
      共 <span x-text="pagination.total"></span> 条记录
    </div>
    <div style="display: flex; gap: 0.5rem;">
      <button @click="changePage(pagination.current - 1)" 
              :disabled="pagination.current <= 1" 
              class="btn btn-sm">
        上一页
      </button>
      <span style="padding: 0.25rem 0.5rem;">
        第 <span x-text="pagination.current"></span> / <span x-text="Math.ceil(pagination.total / pagination.per_page)"></span> 页
      </span>
      <button @click="changePage(pagination.current + 1)" 
              :disabled="pagination.current >= Math.ceil(pagination.total / pagination.per_page)" 
              class="btn btn-sm">
        下一页
      </button>
    </div>
  </div>

  <!-- 创建/编辑会员等级模态框 -->
  <div x-show="showModal" class="modal show">
    <div class="modal-dialog">
      <h3 x-text="editingTier ? '编辑会员等级' : '新增会员等级'"></h3>
      
      <form @submit.prevent="saveTier()">
        <div class="form-group" x-show="!editingTier">
          <label>等级代码 *</label>
          <input type="text" x-model="form.code" class="form-control" required 
                 pattern="[a-zA-Z0-9_]+" title="只能包含字母、数字和下划线">
        </div>
        
        <div class="form-group">
          <label>等级名称 *</label>
          <input type="text" x-model="form.name" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label>等级描述</label>
          <textarea x-model="form.description" class="form-control" rows="3" placeholder="等级特权和说明"></textarea>
        </div>
        
        <div class="form-group">
          <label>价格 (元) *</label>
          <input type="number" x-model="form.price" class="form-control" step="0.01" min="0" required>
        </div>
        
        <div class="form-group">
          <label>有效期 (天)</label>
          <input type="number" x-model="form.duration_days" class="form-control" min="0" placeholder="0表示永久有效">
          <small style="color: #6c757d;">0表示永久有效，大于0表示天数</small>
        </div>
        
        <div class="form-group">
          <label>排序权重</label>
          <input type="number" x-model="form.sort_order" class="form-control" min="0" placeholder="数字越小排序越靠前">
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            <span x-show="!submitting" x-text="editingTier ? '更新' : '创建'"></span>
            <span x-show="submitting">处理中...</span>
          </button>
          <button type="button" @click="closeModal()" class="btn">取消</button>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
function membershipManager() {
  return {
    tiers: [],
    loading: false,
    error: '',
    showDeleted: false,
    
    // 分页
    pagination: {
      current: 1,
      per_page: 10,
      total: 0
    },
    
    // 模态框
    showModal: false,
    editingTier: null,
    submitting: false,
    form: {
      code: '',
      name: '',
      description: '',
      price: 0,
      duration_days: 0,
      sort_order: 0
    },

    init() {
      this.loadTiers();
    },

    async loadTiers() {
      this.loading = true;
      this.error = '';
      
      try {
        const params = {
          page: this.pagination.current,
          per_page: this.pagination.per_page,
          show_deleted: this.showDeleted
        };
        
        const response = await window.$wg.with('manager').membership.list(params);
        
        if (response.data) {
          this.tiers = response.data.items || [];
          if (response.data.pagination) {
            this.pagination = {
              ...this.pagination,
              ...response.data.pagination
            };
          }
        }
      } catch (error) {
        this.error = '加载会员等级列表失败: ' + error.message;
        console.error('Load membership tiers error:', error);
      } finally {
        this.loading = false;
      }
    },

    changePage(page) {
      if (page >= 1 && page <= Math.ceil(this.pagination.total / this.pagination.per_page)) {
        this.pagination.current = page;
        this.loadTiers();
      }
    },

    openCreateModal() {
      this.editingTier = null;
      this.form = {
        code: '',
        name: '',
        description: '',
        price: 0,
        duration_days: 0,
        sort_order: 0
      };
      this.showModal = true;
    },

    editTier(tier) {
      this.editingTier = tier;
      this.form = {
        code: tier.code,
        name: tier.name,
        description: tier.description || '',
        price: tier.price / 100, // 从分转换为元
        duration_days: tier.duration_days || 0,
        sort_order: tier.sort_order || 0
      };
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      this.editingTier = null;
      this.submitting = false;
    },

    async saveTier() {
      this.submitting = true;
      
      try {
        const data = {
          ...this.form,
          price: Math.round(this.form.price * 100) // 转换为分
        };
        
        if (this.editingTier) {
          await window.$wg.with('manager').membership.update(this.editingTier.code, data);
        } else {
          await window.$wg.with('manager').membership.create(data);
        }
        
        this.closeModal();
        this.loadTiers();
        
        // 显示成功消息
        const message = this.editingTier ? '会员等级更新成功' : '会员等级创建成功';
        this.showMessage(message, 'success');
        
      } catch (error) {
        this.error = (this.editingTier ? '更新' : '创建') + '会员等级失败: ' + error.message;
        console.error('Save membership tier error:', error);
      } finally {
        this.submitting = false;
      }
    },

    async deleteTier(code) {
      if (!confirm('确定要删除此会员等级吗？')) return;
      
      try {
        await window.$wg.with('manager').membership.delete(code);
        this.loadTiers();
        this.showMessage('会员等级删除成功', 'success');
      } catch (error) {
        this.error = '删除会员等级失败: ' + error.message;
        console.error('Delete membership tier error:', error);
      }
    },

    async restoreTier(code) {
      try {
        await window.$wg.with('manager').membership.restore(code);
        this.loadTiers();
        this.showMessage('会员等级恢复成功', 'success');
      } catch (error) {
        this.error = '恢复会员等级失败: ' + error.message;
        console.error('Restore membership tier error:', error);
      }
    },

    showMessage(message, type) {
      // 简单的消息提示实现
      const alertDiv = document.createElement('div');
      alertDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'}`;
      alertDiv.textContent = message;
      alertDiv.style.position = 'fixed';
      alertDiv.style.top = '20px';
      alertDiv.style.right = '20px';
      alertDiv.style.zIndex = '9999';
      
      document.body.appendChild(alertDiv);
      
      setTimeout(() => {
        if (alertDiv.parentNode) {
          alertDiv.parentNode.removeChild(alertDiv);
        }
      }, 3000);
    }
  }
}
</script>