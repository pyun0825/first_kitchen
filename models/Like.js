module.exports = (sequelize, DataTypes) => {
  const Like = sequelize.define(
    "Like",
    {
      // id, createdAt, updatedAt 자동 생성
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      store_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: false,
      charset: "utf8",
      collate: "utf8_general_ci",
    }
  );
  Like.associate = (models) => {
    Like.belongsTo(models.User, {
      foreignKey: "user_id",
    });
  };
  return Like;
};
