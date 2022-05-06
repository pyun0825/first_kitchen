module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define(
    "Review",
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
      cart_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      review_content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      charset: "utf8",
      collate: "utf8_general_ci",
    }
  );
  Review.associate = (models) => {
    Review.belongsTo(models.User, {
      foreignKey: "user_id",
    });
    Review.belongsTo(models.Cart, {
      foreignKey: "cart_id",
    });
  };
  return Review;
};
