package com.krbrief.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AdminKeyGuard {
  private final String adminKey;

  public AdminKeyGuard(@Value("${app.adminKey:}") String adminKey) {
    this.adminKey = adminKey == null ? "" : adminKey.trim();
  }

  public boolean adminEnabled() {
    return !adminKey.isBlank();
  }

  /**
   * Admin auth: if adminKey is not configured, treat as "admin disabled" and allow everything.
   * Once ADMIN_KEY is set, only requests with matching key are admin.
   */
  public boolean isAdmin(HttpServletRequest request) {
    if (!adminEnabled()) return true;

    String header = request.getHeader("X-Admin-Key");
    if (header != null && header.equals(adminKey)) return true;

    String q = request.getParameter("adminKey");
    if (q != null && q.equals(adminKey)) return true;

    return false;
  }
}
