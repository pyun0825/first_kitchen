import bcrypt from "bcrypt";
import { User, Cart, Incart, Like } from "../../models";
import { groupBy } from "lodash";
import axios from "axios";

// const store1 = {
//   store_id: 1,
//   storeName: "Hell's Kitchen",
//   storeAddress: "고려대로28",
//   isOpen: true,
//   fee: 1000,
// };
// const store2 = {
//   store_id: 2,
//   storeName: "Burger King",
//   storeAddress: "안암로123",
//   isOpen: true,
//   fee: 2500,
// };
// const store3 = {
//   store_id: 3,
//   storeName: "안암꼬치",
//   storeAddress: "안암로1223",
//   isOpen: false,
//   fee: 3000,
// };

export const home = async (req, res) => {
  // 필요한 가계 정보 받아서 출력
  // store = {store_id, storeName, storeAddress, isOpen}
  const apiRes = await axios
    .post(`http://192.168.100.62:4000/consumer/getAllStore`)
    .catch(function (error) {
      if (error.response) {
        // req, res 됐으나 res가 에러를 반환시 (status code != 2xx)
        console.log("점주측 서버 에러 - 가계정보 못받아옴", error.response);
        return res.render("home", { pageTitle: "First Kitchen", stores: [] });
      } else if (error.request) {
        // res 없음, 통신 두절
        console.log("통신 두절 - 가계정보 못받아옴", error.request);
        return res.render("home", { pageTitle: "First Kitchen", stores: [] });
      } else {
        console.log("Error", error.message);
        return res.render("home", { pageTitle: "First Kitchen", stores: [] });
      }
    });
  const stores = apiRes.data.store;
  return res.render("home", { pageTitle: "First Kitchen", stores });
};

export const getLogin = (req, res) => {
  return res.render("login", { pageTitle: "Log In" });
};

export const postLogin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({
    where: {
      email,
    },
  });
  if (!user) {
    console.log("No id found");
    return res
      .status(400)
      .send(
        "<script>alert('아이디가 없습니다!'); window.location.replace('/login');</script>"
      );
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    console.log("password incorrect");
    return res
      .status(400)
      .send(
        "<script>alert('패스워드가 틀립니다.'); window.location.replace('/login');</script>"
      );
  }
  req.session.loggedIn = true;
  req.session.user = user;
  return res.redirect("/");
};

export const getJoin = (req, res) => {
  return res.render("join", { pageTitle: "Join" });
};

export const postJoin = async (req, res) => {
  const { email, nickname, password, password2, tel } = req.body;
  if (password !== password2) {
    return res
      .status(400)
      .send(
        "<script>alert('패스워드가 일치하지 않습니다.'); window.location.replace('/join');</script>"
      );
  }
  const exists = await User.findOne({
    where: {
      email,
    },
  });
  if (exists) {
    console.log("Account already exists with corresponding email");
    return res
      .status(400)
      .send(
        "<script>alert('이미 계정이 존재 합니다.'); window.location.replace('/login');</script>"
      );
  }
  try {
    await User.create({
      email,
      nickname,
      password,
      tel,
    });
    return res.redirect("/login");
  } catch (error) {
    console.log(error);
    return res.status(400).render("join");
  }
};

export const logout = (req, res) => {
  req.session.destroy();
  return res.redirect("/");
};

export const getCart = async (req, res) => {
  const cart = await Cart.findOne({
    where: {
      user_id: req.session.user.id,
      finished: false,
    },
  });
  if (!cart) {
    return res.render("cart", { pageTitle: "Cart", grouped: {} });
  }
  let incarts = await Incart.findAll({
    where: {
      cart_id: cart.id,
    },
    raw: true,
  });
  console.log(incarts);
  const menus = await axios.post(
    `http://192.168.100.62:4000/consumer/getAllStore`,
    { data: incarts }
  );
  const menu = {
    product_id: 1,
    name: "햄버거",
    price: 7000,
    memo: "맛있습니다",
    isRecommended: true,
    type: 0,
  };
  for (const i in incarts) {
    incarts[i].name = menu.name;
    incarts[i].price = menu.price;
    incarts[i].store_name = "Store " + incarts[i].store_id; //store name 도 받아와야 할듯
  }
  const grouped = groupBy(incarts, "store_id");
  //그리고 page에 store 별로 메뉴 render
  return res.render("cart", { pageTitle: "Cart", grouped });
};

export const deleteCart = async (req, res) => {
  const { cart_id, incart_id } = req.query;
  await Incart.destroy({
    where: {
      id: incart_id,
      cart_id,
    },
  });
  return res.redirect("/user/cart");
};

export const getProfile = async (req, res) => {
  const { id } = req.session.user;
  //profile에 뭐 표시 할건지 생각
  //edit profile, change pw, 좋아요 목록
  return res.render("profile", { pageTitle: "Profile" });
};

export const getLikes = async (req, res) => {
  const { id } = req.session.user;
  const likeArr = await Like.findAll({
    where: {
      user_id: id,
    },
    raw: true,
  });
  //Like 한 store_id 들 jj로 보내고 관련 store 정보 home화면과 같이 받아온다.
  let stores = [store1, store2, store3];
  return res.render("likes", { pageTitle: "Likes", stores });
};

export const postCart = async (req, res) => {
  const { id } = req.session.user;
  const cart = await Cart.findOne({
    where: {
      user_id: id,
      finished: false,
    },
  });
  if (!cart) {
    //장바구니가 애초에 안 만들어졌을 때
    console.log("장바구니에 든 제품이 없습니다!");
    return res.redirect("/");
  }
  const orders = await Incart.findAll({
    where: {
      cart_id: cart.id,
    },
    raw: true,
  });
  if (orders.length === 0) {
    // 장바구니 만들어졌으나 안에 내용물을 다 비웠을 때
    console.log("장바구니에 든 제품이 없습니다!");
    return res.redirect("/");
  }
  //주문 답변 오면 finished true로
  const sendingParams = {
    store_id: 1,
    user_id: req.session.user.id,
    user_nickname: req.session.user.nickname,
    deliveryApp: "First Kitchen",
    receptionType: "Delivery",
    orderTime: new Date(),
    jibunAddress: "한글",
    roadAddress: "NOT IN DB YET",
    addressDetail: "NOT IN DB YET",
    memo: "WILL ADD",
    request: "WILL ADD",
    tel: req.session.user.tel,
    payType: "None",
    totalPaidPrice: 230000,
    totalPrice: 10100,
    discountPrice: 200,
    deliveryPrice: 1000,
    orders: orders,
  };
  axios
    .post(`http://192.168.100.62:4000/consumer/postDeliveryInfo`, {
      data: sendingParams,
    })
    .then(function (response) {
      const delivery_id = response.data.id;
      cart.update({ finished: true, delivery_id, orderTime: new Date() });
      return res.redirect("/");
    })
    .catch(function (error) {
      console.log(error);
      return res.redirect("/");
    });
};

export const postStatus = (req, res) => {};
