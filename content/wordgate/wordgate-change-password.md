---
title: "修改密码"
description: "修改您的账户密码"
layout: "wordgate"
url: "/change-password"
---

{{< wordgate-auth-required message="请先登录才能修改密码" login_url="/login/" >}}

{{< wordgate-user-change-password >}}

{{< /wordgate-auth-required >}}
