module.exports = (sequelize, DataTypes) => {
  const Incart = sequelize.define(
    "Incart",
    {
      // id 자동 생성
      store_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      menu_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      menu_type: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cart_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
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
  Incart.associate = (models) => {
    Incart.belongsTo(models.Cart, {
      foreignKey: "cart_id",
      onDelete: "cascade",
    });
  };
  return Incart;
};
