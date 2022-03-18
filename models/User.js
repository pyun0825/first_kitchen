import bcrypt from "bcrypt";

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    // id, createdAt, updatedAt 자동 생성
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nickname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tel: {
      type: DataTypes.STRING,
    },
    // 위치 정보 needs to be added
  });
  User.associate = (models) => {
    User.hasMany(models.Cart, {
      foreignKey: "user_id",
    });
  };
  User.beforeSave(async (user, options) => {
    if (user.changed("password")) {
      user.password = await bcrypt.hash(user.password, 5);
    }
  });
  return User;
};
