module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define(
    "Cart",
    {
      // id 자동 생성
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      orderTime: {
        type: DataTypes.DATE,
      },
      finished: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },
    {
      timestamps: false,
    }
  );
  Cart.associate = (models) => {
    Cart.belongsTo(models.User, {
      foreignKey: "user_id",
      onDelete: "cascade",
    });
    Cart.hasMany(models.Incart, {
      foreignKey: "cart_id",
    });
  };
  return Cart;
};
