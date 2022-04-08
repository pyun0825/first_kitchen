import bcrypt from "bcrypt";

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
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
      jibunAddress: {
        type: DataTypes.STRING,
      },
      roadAddress: {
        type: DataTypes.STRING,
      },
      addressDetail: {
        type: DataTypes.STRING,
      },
      latitude: {
        type: DataTypes.DOUBLE,
      },
      longitude: {
        type: DataTypes.DOUBLE,
      },
      addressDetail: {
        type: DataTypes.STRING,
      },
      subscription: {
        type: DataTypes.JSON,
      },
      // 위치 정보 needs to be added
    },
    {
      charset: "utf8",
      collate: "utf8_general_ci",
    }
  );
  User.associate = (models) => {
    User.hasMany(models.Cart, {
      foreignKey: "user_id",
    });
    User.hasMany(models.Like, {
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
