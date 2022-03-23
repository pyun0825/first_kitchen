import { Cart, Incart, Like } from "../../models";

export const getStore = async (req, res) => {
  const { id } = req.params; //==storeId
  // 이때 id를 점주측에 보내주면 해당 가계의 모든 메뉴 정보 전달 받아야
  // menu = {product_id, name, price, memo, isRecommended, type}
  //가계 정보도 다 받아야 할듯
  // store = {storeName, storeAddress, isOpen, fee}
  const store = {
    store_id: id,
    storeName: "Dummy Store",
    storeAddress: "고려대로123",
    isOpen: true,
    fee: 2500,
  };
  const menu1 = {
    product_id: 1,
    name: "햄버거",
    price: 7000,
    memo: "맛있습니다",
    isRecommended: true,
    type: 0,
  };
  const menu2 = {
    product_id: 2,
    name: "피자",
    price: 12000,
    memo: "굿이에요",
    isRecommended: true,
    type: 1,
  };
  const menu3 = {
    product_id: 3,
    name: "치킨",
    price: 9000,
    memo: "좋아요",
    isRecommended: false,
    type: 2,
  };
  let menus = [menu1, menu2, menu3];
  let like = null;
  if (req.session.loggedIn) {
    like = await Like.findOne({
      where: {
        user_id: req.session.user.id,
        store_id: id,
      },
    });
  }
  return res.render("storeInfo", {
    pageTitle: store.storeName,
    store,
    menus,
    like,
  });
};

export const postStore = (req, res) => {
  //좋아요 버튼
  const { id } = req.params; //storeid
  const { submit } = req.body;
  if (submit === "Like") {
    Like.create({
      user_id: req.session.user.id,
      store_id: id,
    });
  } else {
    Like.destroy({
      where: {
        user_id: req.session.user.id,
        store_id: id,
      },
    });
  }
  return res.redirect(`/stores/${id}`);
};

export const getMenu = (req, res) => {
  const { id, menu_id } = req.params;
  const { type } = req.query; // 메뉴 종류, 단품/세트/기타
  // get menu info from jj
  const menu = {
    product_id: 1,
    name: "햄버거",
    price: 7000,
    memo: "맛있습니다",
    isRecommended: true,
    type: 0,
  };
  res.render("menuInfo", { pageTitle: "메뉴 상세", menu, store_id: id });
};

export const postMenu = async (req, res) => {
  const { id, menu_id } = req.params;
  const { type } = req.query; // 메뉴 종류, 단품/세트/기타
  const { quantity } = req.body;
  let cart = await Cart.findOne({
    where: {
      user_id: req.session.user.id,
      finished: false,
    },
  });
  if (!cart) {
    cart = await Cart.create({
      user_id: req.session.user.id,
    });
  }
  // await Incart.create({
  //   store_id: id,
  //   menu_id,
  //   menu_type: type,
  //   cart_id: cart.id,
  //   quantity,
  // });
  const prevAdded = await Incart.findOne({
    where: {
      cart_id: cart.id,
      store_id: id,
      menu_id,
      menu_type: type,
    },
  });
  if (!prevAdded) {
    await Incart.create({
      store_id: id,
      menu_id,
      menu_type: type,
      cart_id: cart.id,
      quantity,
    });
  } else {
    Incart.increment(
      { quantity },
      {
        where: {
          id: prevAdded.id,
        },
      }
    );
  }
  return res.redirect(`/stores/${id}`);
};
