---
title: "我的地址"
layout: "wordgate"
url: "/addresses"
---

{{< wordgate-auth-required message="请登录以查看您的地址" login_url="/login/" >}}
{{< wordgate-user-address-list >}}
{{< /wordgate-auth-required >}}