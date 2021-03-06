import axios from "axios";
import { Cart, Incart, Like, sequelize } from "../../models";
import { QueryTypes } from "sequelize";
import { Review, User } from "../../models";

const NGROK_IP = "https://793f-121-128-252-18.jp.ngrok.io";
const JJ_IP = "http://192.168.100.57:4000";

/*
 * 가계 상세 정보 조회
 * 가계id 점주측으로 보내고 가계 정보, 메뉴들을 받아와 JSON Parse해주고 상세 정보 페이지 render
 */
export const getStore = async (req, res) => {
  const { id } = req.params; //==storeId
  const apiResult = await axios.post(`${JJ_IP}/consumer/getStoreInfo`, {
    data: { store_id: id },
  });
  const parsedRes = JSON.parse(apiResult.data.result);
  const store = parsedRes[0];
  if (store.isOpen == 0) {
    return res
      .status(400)
      .send(
        "<script>alert('영업 준비 중인 가게입니다!'); window.location.replace('/');</script>"
      );
  }
  const [found] = await sequelize.query(
    `SELECT avg(rating) as rating, count(*) as count FROM reviews WHERE store_id = ${id} GROUP BY store_id`,
    { type: QueryTypes.SELECT }
  );
  if (found) {
    store.rating = parseFloat(found.rating);
    store.rating_count = found.count;
  } else {
    store.rating = 0;
    store.rating_count = 0;
  }
  parsedRes[1].map((x) => (x["type"] = 0));
  parsedRes[2].map((x) => (x["type"] = 1));
  parsedRes[3].map((x) => (x["type"] = 2));
  let menus = [...parsedRes[1], ...parsedRes[2], ...parsedRes[3]];
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

/*
 * 가계 찜하기
 * user-store 쌍을 좋아요 db에 저장
 */
export const postStore = (req, res) => {
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

/*
 * 메뉴 상세 정보
 * 메뉴id, type, 가계id 점주측 서버로 보내 메뉴 상세 정보 받아와 출력
 */
export const getMenu = async (req, res) => {
  const { id, menu_id } = req.params;
  const { type } = req.query; // 메뉴 종류, 단품/세트/기타
  // get menu info from jj
  const apiRes = await axios.post(`${JJ_IP}/consumer/getMenuInfo`, {
    data: { store_id: id, menu_id, menu_type: type },
  });
  res.render("menuInfo", {
    pageTitle: "메뉴 상세",
    menu: apiRes.data.menu,
    store_id: id,
  });
};

/*
 * 메뉴 장바구니에 넣기
 * 유저가 주문 안한 장바구니 객체 있을 시 해당 장바구니에 추가. 없으면 장바구니 만들어서 추가
 * 같은 메뉴 이미 장바구니에 있을 시 수량만 update
 */
export const postMenu = async (req, res) => {
  const { id, menu_id } = req.params;
  const { type } = req.query; // 메뉴 종류, 단품/세트/기타
  const { quantity } = req.body;
  var cart = await Cart.findOne({
    where: {
      user_id: req.session.user.id,
      store_id: id,
      finished: false,
    },
  });
  if (!cart) {
    cart = await Cart.create({
      user_id: req.session.user.id,
      store_id: id,
    });
  }
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

/*
 * 가게 리뷰 정보 조회
 */
export const getStoreReviews = async (req, res) => {
  const { id, storeName } = req.params;
  const reviews = await Review.findAll({
    include: [{ model: User }],
    order: [["createdAt", "DESC"]],
    where: { store_id: id },
    raw: true,
  });
  return res.status(200).render("storeReviews", { storeName, reviews });
};
