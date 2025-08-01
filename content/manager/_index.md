---
title: "管理后台"
description: "WordGate 应用管理中心"
layout: "manager"
---

<div x-data="dashboardData()" x-init="init()">
  <!-- 统计卡片 -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
    <!-- 产品统计 -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 0.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;" x-text="stats.products || 0"></div>
          <div style="opacity: 0.9;">产品总数</div>
        </div>
        <div style="font-size: 2rem; opacity: 0.8;">📦</div>
      </div>
    </div>

    <!-- 订单统计 -->
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 1.5rem; border-radius: 0.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;" x-text="stats.orders || 0"></div>
          <div style="opacity: 0.9;">订单总数</div>
        </div>
        <div style="font-size: 2rem; opacity: 0.8;">📝</div>
      </div>
    </div>

    <!-- 用户统计 -->
    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 1.5rem; border-radius: 0.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;" x-text="stats.users || 0"></div>
          <div style="opacity: 0.9;">用户总数</div>
        </div>
        <div style="font-size: 2rem; opacity: 0.8;">👥</div>
      </div>
    </div>

    <!-- 收入统计 -->
    <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 1.5rem; border-radius: 0.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;" x-text="formatMoney(stats.revenue || 0)"></div>
          <div style="opacity: 0.9;">总收入</div>
        </div>
        <div style="font-size: 2rem; opacity: 0.8;">💰</div>
      </div>
    </div>
  </div>

  <!-- 快速操作 -->
  <div style="background: #fff; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 2rem;">
    <h3 style="margin: 0 0 1rem 0; color: #495057;">快速操作</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
      <a href="/manager/products/" class="btn btn-primary" style="text-decoration: none; text-align: center;">
        📦 管理产品
      </a>
      <a href="/manager/orders/" class="btn btn-primary" style="text-decoration: none; text-align: center;">
        📝 查看订单
      </a>
      <a href="/manager/users/" class="btn btn-primary" style="text-decoration: none; text-align: center;">
        👥 管理用户
      </a>
      <a href="/manager/membership/" class="btn btn-primary" style="text-decoration: none; text-align: center;">
        💎 会员管理
      </a>
      <a href="/manager/config/" class="btn btn-primary" style="text-decoration: none; text-align: center;">
        ⚙️ 系统配置
      </a>
      <a href="/manager/profile/" class="btn btn-primary" style="text-decoration: none; text-align: center;">
        🏢 应用信息
      </a>
    </div>
  </div>

  <!-- 最近订单 -->
  <div style="background: #fff; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h3 style="margin: 0;">最近订单</h3>
      <a href="/manager/orders/" style="color: #007bff; text-decoration: none;">查看全部 →</a>
    </div>
    
    <div x-show="loading" style="text-align: center; padding: 2rem; color: #6c757d;">
      正在加载...
    </div>
    
    <div x-show="!loading && recentOrders.length === 0" style="text-align: center; padding: 2rem; color: #6c757d;">
      暂无订单
    </div>
    
    <div x-show="!loading && recentOrders.length > 0" class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>用户</th>
            <th>金额</th>
            <th>状态</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <template x-for="order in recentOrders" :key="order.id">
            <tr>
              <td>
                <a :href="'/manager/orders/' + order.order_no" style="color: #007bff; text-decoration: none;" x-text="order.order_no"></a>
              </td>
              <td x-text="order.user_info?.nickname || order.user_info?.email || '用户' + order.user_id"></td>
              <td x-text="formatMoney(order.amount)"></td>
              <td>
                <span x-show="order.is_paid" style="color: #28a745;">✓ 已支付</span>
                <span x-show="!order.is_paid" style="color: #ffc107;">⏳ 未支付</span>
              </td>
              <td x-text="formatDate(order.created_at)"></td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</div>

<script>
function dashboardData() {
  return {
    loading: false,
    stats: {
      products: 0,
      orders: 0,
      users: 0,
      revenue: 0
    },
    recentOrders: [],

    async init() {
      await this.loadDashboardData();
    },

    async loadDashboardData() {
      this.loading = true;
      
      try {
        // 并发加载各种数据
        const [ordersResponse] = await Promise.all([
          window.$wg.with('manager').orders.list({ page: 1, per_page: 5, sort_by: 'created_at', sort_desc: true })
        ]);
        
        // 设置最近订单
        if (ordersResponse.data && ordersResponse.data.items) {
          this.recentOrders = ordersResponse.data.items;
          this.stats.orders = ordersResponse.data.pagination?.total || 0;
          
          // 计算总收入
          this.stats.revenue = this.recentOrders.reduce((total, order) => {
            return total + (order.is_paid ? order.amount : 0);
          }, 0);
        }
        
        // 加载其他统计数据
        this.loadOtherStats();
        
      } catch (error) {
        console.error('加载仪表板数据失败:', error);
      } finally {
        this.loading = false;
      }
    },

    async loadOtherStats() {
      try {
        // 加载产品统计
        const productsResponse = await window.$wg.with('manager').products.list({ page: 1, per_page: 1 });
        if (productsResponse.data && productsResponse.data.pagination) {
          this.stats.products = productsResponse.data.pagination.total || 0;
        }
        
        // 加载用户统计
        const usersResponse = await window.$wg.with('manager').users.list({ page: 1, per_page: 1 });
        if (usersResponse.data && usersResponse.data.pagination) {
          this.stats.users = usersResponse.data.pagination.total || 0;
        }
      } catch (error) {
        console.error('加载统计数据失败:', error);
      }
    },

    formatMoney(amount) {
      return window.$wg.helper.formatMoney(amount);
    },

    formatDate(dateStr) {
      return window.$wg.helper.formatDate(dateStr);
    }
  }
}
</script>