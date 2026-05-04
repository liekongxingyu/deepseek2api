import { config } from "../config.js";
import { saveAccount } from "./account-service.js";

function isEmail(loginValue) {
  return loginValue.includes("@");
}

export function createBaseHeaders(token, extraHeaders = {}) {
  const headers = {
    "x-app-version": config.deepseekHeaders.appVersion,
    "x-client-version": config.deepseekHeaders.clientVersion,
    "x-client-platform": config.deepseekHeaders.clientPlatform,
    "x-client-locale": config.deepseekHeaders.locale,
    "x-client-timezone-offset": config.deepseekHeaders.timezoneOffset,
    ...extraHeaders
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  return headers;
}

function buildLoginPayload(loginValue, password, deviceId) {
  return {
    email: isEmail(loginValue) ? loginValue : "",
    mobile: isEmail(loginValue) ? "" : loginValue,
    password,
    area_code: "+86",
    device_id: deviceId,
    os: "web"
  };
}

export async function loginToDeepseek({ loginValue, password, deviceId }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${config.deepseekBaseUrl}/api/v0/users/login`, {
      method: "POST",
      headers: createBaseHeaders("", { "content-type": "application/json" }),
      body: JSON.stringify(buildLoginPayload(loginValue, password, deviceId)),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const text = await response.text();
    if (!text) {
      throw new Error("Empty response from DeepSeek");
    }

    const result = JSON.parse(text);
    if (result.data?.biz_code !== 0) {
      throw new Error(result.msg || result.data?.biz_msg || "DeepSeek login failed");
    }

    return result;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Login request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function refreshAccountToken(account) {
  const loginResult = await loginToDeepseek({
    loginValue: account.loginValue,
    password: account.password,
    deviceId: account.deviceId
  });

  return saveAccount({
    ...account,
    token: loginResult.data.biz_data.user.token
  });
}
