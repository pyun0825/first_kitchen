import bcrypt from "bcrypt";
import { User, Cart, Incart, Like } from "../../models";
import { groupBy } from "lodash";
import axios from "axios";
import webpush from "web-push";

const JJ_IP = "192.168.100.65";

/*
 * Home화면 render
 * 사용자 주변 몇 km 이내 가계 정보 받아와서 출력
 * 현재는 모든 가계 받아오도록
 */
export const home = async (req, res) => {
  const apiRes = await axios
    .post(`http://${JJ_IP}:4000/consumer/getAllStore`)
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

/*
 * 로그인 페이지 render
 */
export const getLogin = (req, res) => {
  return res.render("login", { pageTitle: "Log In" });
};

/*
 * 로그인 처리
 * email로 db query해서 비밀번호 일치 시 session으로 로그인 처리하고 home으로 redirect.
 * db에 해당 email 없거나 비밀번호 틀릴 시 alert창 띄운다.
 */
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

/*
 * 회원가입 페이지 render
 */
export const getJoin = (req, res) => {
  return res.render("join", {
    pageTitle: "Join",
    api_key: process.env.KAKAO_KEY,
  });
};

/*
 * 회원가입 처리
 * Form으로 받어온 정보대로 db에 저장.
 * 비밀번호1,2 불일치, 이메일 이미 존재 시 alert창 띄운다.
 */
export const postJoin = async (req, res) => {
  const {
    email,
    nickname,
    password,
    password2,
    tel,
    roadAddress,
    jibunAddress,
    addressDetail,
    latitude,
    longitude,
  } = req.body;
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
      roadAddress,
      jibunAddress,
      addressDetail,
      latitude,
      longitude,
    });
    return res.redirect("/login");
  } catch (error) {
    console.log(error);
    return res.status(400).render("join");
  }
};

/*
 * 로그아웃 처리
 * session 삭제 후 home으로 redirect
 */
export const logout = (req, res) => {
  req.session.destroy();
  return res.redirect("/");
};

/*
 * 장바구니 조회
 * finished: False인 loggedin 유저의 장바구니 내 incarts(메뉴, 수량 정보)를 배열로 찾아 옴
 * incarts들을 점주측 서버로 보내고 그 배열에 메뉴 이름, 가격, 가계 이름을 추가한 배열을 다시 받아 출력
 */
export const getCart = async (req, res) => {
  const carts = await Cart.findAll({
    where: {
      user_id: req.session.user.id,
      finished: false,
    },
    raw: true,
  });
  if (!carts) {
    return res.render("cart", { pageTitle: "Cart", grouped: {} });
  }
  var incarts = [];
  for (const i in carts) {
    const incart = await Incart.findAll({
      where: {
        cart_id: carts[i].id,
      },
      raw: true,
    });
    incarts.push(...incart);
  }
  const apiResult = await axios.post(
    `http://${JJ_IP}:4000/consumer/getCartMenu`,
    {
      data: incarts,
    }
  );
  const menus = JSON.parse(apiResult.data.incarts);
  const grouped = groupBy(menus, "store_id");
  //그리고 page에 store 별로 메뉴 render
  return res.render("cart", { pageTitle: "Cart", grouped });
};

/*
 * 장바구니 메뉴 삭제
 */
export const deleteCart = async (req, res) => {
  const { cart_id, incart_id } = req.query;
  await Incart.destroy({
    where: {
      id: incart_id,
      cart_id,
    },
  });
  // Cart에 담긴 것이 없으면 삭제
  const incarts = await Incart.findAll({ where: { cart_id }, raw: true });
  if (incarts.length === 0) {
    await Cart.destroy({
      where: {
        id: cart_id,
      },
    });
  }
  return res.redirect("/user/cart");
};

/*
 * 유저 profile 페이지
 */
export const getProfile = async (req, res) => {
  const { id } = req.session.user;
  //profile에 뭐 표시 할건지 생각
  //edit profile, change pw, 좋아요 목록
  return res.render("profile", { pageTitle: "Profile" });
};

/*
 * 찜한 가계 목록 조회
 */
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

/*
 * 주문 신청
 *
 */
export const postCart = async (req, res) => {
  const { id, nickname, jibunAddress, roadAddress, addressDetail, tel } =
    req.session.user;
  const carts = await Cart.findAll({
    where: {
      user_id: id,
      finished: false,
    },
    raw: false,
  });
  if (!carts) {
    //장바구니가 애초에 안 만들어졌을 때
    console.log("No carts available");
    return res.redirect("/");
  }
  for (const i in carts) {
    const orders = await Incart.findAll({
      where: {
        cart_id: carts[i].dataValues.id,
      },
      raw: true,
    });
    //주문 답변 오면 finished true로
    const sendingParams = {
      store_id: carts[i].dataValues.store_id,
      user_id: id,
      user_nickname: nickname,
      deliveryApp: "First Kitchen",
      receptionType: "DELIVERY",
      orderTime: new Date(),
      jibunAddress,
      roadAddress,
      addressDetail,
      memo: "WILL ADD",
      request: "WILL ADD",
      tel: tel,
      payType: 1,
      orders: orders,
    };
    axios
      .post(`http://${JJ_IP}:4000/consumer/postDeliveryInfo`, {
        data: sendingParams,
      })
      .then(function (response) {
        const delivery_id = response.data.id;
        carts[i].update({ finished: true, delivery_id, orderTime: new Date() });
      })
      .catch(function (error) {
        console.log(error);
      });
  }
  return res.redirect("/");
};

/*
 * 주문 상태 변경 처리
 */
export const postStatus = async (req, res) => {
  console.log("왔음");
  const { delivery_id, status } = req.body.data;
  const cart = await Cart.findOne({
    where: {
      delivery_id,
    },
  });
  if (!cart) {
    console.log("주문내역 발견 실패!!!!");
    return res.status(404);
  }
  const { subscription } = await User.findOne({
    where: {
      id: cart.user_id,
    },
  });
  const payload = JSON.stringify({
    title: "First Kitchen",
    body: `주문 상태가 변경되었습니다!`,
  });
  webpush
    .sendNotification(subscription, payload)
    .catch((err) => console.error(err));
  return res.status(201).json({});
};

/*
 * Service Worker 등록
 */
export const postSubscribe = async (req, res) => {
  if (!res.locals.loggedIn) {
    return res.status(400).json({});
  }
  const { id } = req.session.user;
  const subscription = req.body;
  await User.update(
    { subscription },
    {
      where: {
        id,
      },
    }
  );
  res.status(201).json({});
};
