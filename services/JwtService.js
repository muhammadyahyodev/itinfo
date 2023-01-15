/**
 * @class JwtService
 */

const jwt = require("jsonwebtoken");
const config = require("config");

/**
 * @name: JwtService
 */
class JwtService {
  /**
   * JwtService constructor
   * @param accessKey
   * @param refreshKey
   * @param accessTime
   * @param refreshTime
   */
  constructor(accessKey, refreshKey, accessTime, refreshTime) {
    this.accessKey = accessKey;
    this.refreshKey = refreshKey;
    this.accessTime = accessTime;
    this.refreshTime = refreshTime;
  }

  /**
   * Verify token
   * @param token
   * @param callback
   * @returns {*}
   */
  async verifyAccess(token) {
    return jwt.verify(token, this.accessKey, {});
  }

  async verifyRefresh(token) {
    return jwt.verify(token, this.refreshKey, {});
  }

  generateTokens(payload) {
    console.log("access key: ", this.accessKey);
    console.log("access time: ", this.accessTime);
    const accessToken = jwt.sign(payload, this.accessKey, {
      expiresIn: this.accessTime,
    });

    const refreshToken = jwt.sign(payload, this.refreshKey, {
      expiresIn: this.refreshTime,
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}

module.exports = new JwtService(
  config.get("access_key"),
  config.get("refresh_key"),
  config.get("access_time"),
  config.get("refresh_time")
);
