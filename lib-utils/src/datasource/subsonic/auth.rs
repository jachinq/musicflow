// Subsonic 认证模块
// 实现 token+salt 和明文密码两种认证方式

use md5::{Digest, Md5};
use rand::{distributions::Alphanumeric, thread_rng, Rng};

/// Subsonic 认证管理器
pub struct SubsonicAuth {
    username: String,
    password: String,
    use_token: bool,
}

impl SubsonicAuth {
    /// 创建新的认证管理器
    ///
    /// # 参数
    /// * `username` - 用户名
    /// * `password` - 密码
    /// * `use_token` - 是否使用 token 认证(推荐)
    pub fn new(username: String, password: String, use_token: bool) -> Self {
        Self {
            username,
            password,
            use_token,
        }
    }

    /// 生成认证参数
    ///
    /// # 返回
    /// 返回 (参数名, 参数值) 的向量,包含:
    /// - `u`: 用户名
    /// - `t`: token (MD5(password+salt))
    /// - `s`: salt (随机字符串)
    pub fn get_auth_params(&self) -> Vec<(&str, String)> {
        if self.use_token {
            let salt = self.generate_salt();
            let token = self.generate_token(&salt);

            vec![
                ("u", self.username.clone()),
                ("t", token),
                ("s", salt),
            ]
        } else {
            // 明文密码模式(不推荐)
            vec![
                ("u", self.username.clone()),
                ("p", self.password.clone()),
            ]
        }
    }

        /// 生成随机 salt
        fn generate_salt(&self) -> String {
            thread_rng()
                .sample_iter(&Alphanumeric)
                .take(16)
                .map(char::from)
                .collect()
        }

        /// 生成认证 token
        ///
        /// token = MD5(password + salt)
        fn generate_token(&self, salt: &str) -> String {
            let raw = format!("{}{}", self.password, salt);
            let mut hasher = Md5::new();
            hasher.update(raw.as_bytes());
            let result = hasher.finalize();
            hex::encode(result)
        }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_auth_params() {
        let auth = SubsonicAuth::new(
            "testuser".to_string(),
            "testpass".to_string(),
            true,
        );

        let params = auth.get_auth_params();
        assert_eq!(params.len(), 3);
        assert_eq!(params[0].0, "u");
        assert_eq!(params[0].1, "testuser");
        assert_eq!(params[1].0, "t");
        assert_eq!(params[2].0, "s");
    }

    #[test]
    fn test_token_generation() {
        let auth = SubsonicAuth::new(
            "admin".to_string(),
            "admin".to_string(),
            true,
        );

        // 测试 token = MD5("admin" + "salt")
        let token = auth.generate_token("salt");
        // MD5("adminsalt") = f4a679d2c7e7b05d7a866eead6ef0d5e
        assert_eq!(token, "f4a679d2c7e7b05d7a866eead6ef0d5e");
    }
}
