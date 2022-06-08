import bcrypt from "bcrypt";
import { User, Cart, Incart, Like, Review, sequelize } from "../../models";
import { add, endsWith, groupBy, toArray, toInteger } from "lodash";
import axios, { Axios } from "axios";
import webpush from "web-push";
import { QueryTypes } from "sequelize";

const NGROK_IP = "https://793f-121-128-252-18.jp.ngrok.io";
const JJ_IP = "http://192.168.100.57:4000";

/*
 * 두 좌표 사이 거리
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/*
 * Home화면 render
 * 사용자 주변 몇 km 이내 가계 정보 받아와서 출력
 * 현재는 모든 가계 받아오도록
 */
export const home = async (req, res) => {
  let { distSort, ratingSort } = req.query;
  let x = null;
  let y = null;
  if (req.session.loggedIn) {
    x = req.session.user.longitude;
    y = req.session.user.latitude;
  }
  axios
    .post(`${JJ_IP}/consumer/getAllStore`, {
      data: { x, y },
    })
    .then(async (response) => {
      const stores = response.data.answer;
      if (!stores) {
        console.log("가게 정보 null");
        return res.render("home", { pageTitle: "First Kitchen", stores: [] });
      }
      const reviews = await sequelize.query(
        "SELECT store_id, avg(rating) as rating, count(*) as count FROM reviews GROUP BY store_id",
        { type: QueryTypes.SELECT }
      );
      stores.forEach((store) => {
        const found = reviews.find((review) => review.store_id === store.id);
        if (found) {
          store.rating = parseFloat(found.rating);
          store.rating_count = toInteger(found.count);
        } else {
          store.rating = 0;
          store.rating_count = 0;
        }
        console.log(store);
        store.distance = getDistanceFromLatLonInKm(
          y,
          x,
          store.latitude,
          store.longitude
        );
      });
      toArray(stores);
      if (distSort && ratingSort) {
        // 둘다 체크 된 경우 -> 불가능, url로 이렇게 접근시 무효 처리
        distSort = null;
        ratingSort = null;
      } else if (distSort === "1") {
        stores.sort(function (a, b) {
          return a.distance - b.distance;
        });
      } else if (ratingSort === "1") {
        stores.sort(function (a, b) {
          return b.rating - a.rating;
        });
      }
      res.locals.distSort = distSort;
      res.locals.ratingSort = ratingSort;
      return res.render("home", { pageTitle: "First Kitchen", stores });
    })
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
export const logout = async (req, res) => {
  const { id } = req.session.user;
  await User.update({ subscription: null }, { where: { id } });
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
  const apiResult = await axios.post(`${JJ_IP}/consumer/getCartMenu`, {
    data: incarts,
  });
  const menus = JSON.parse(apiResult.data.incarts);
  const grouped = groupBy(menus, "store_id");
  // for (let stores in grouped) {
  //   grouped[stores].push(
  //     grouped[stores].reduce((prev, curr) => prev.price + curr.price)
  //   );
  // }
  console.log(grouped);
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
  let { id: param_id } = req.params;
  let { id: session_id } = req.session.user;
  param_id = toInteger(param_id);
  //profile에 뭐 표시 할건지 생각
  //edit profile, change pw, 좋아요 목록
  if (param_id === session_id)
    return res.render("profile", { pageTitle: "Profile", id: session_id });
  else {
    return res
      .status(400)
      .send(
        "<script>alert('로그인 한 계정과 조회하려는 계정이 일치하지 않습니다!'); window.location.replace('/');</script>"
      );
  }
};

/**
 * 유저 프로파일 (배송 주소 등 수정)
 */
export const getEditProfile = async (req, res) => {
  let { id: param_id } = req.params;
  let { id: session_id } = req.session.user;
  param_id = toInteger(param_id);
  if (param_id === session_id) {
    return res.render("editProfile", {
      pageTitle: "Edit Profile",
      user: req.session.user,
      api_key: process.env.KAKAO_KEY,
    });
  } else {
    return res
      .status(400)
      .send(
        "<script>alert('로그인 한 계정과 수정하려는 계정이 일치하지 않습니다!'); window.location.replace('/');</script>"
      );
  }
};

/**
 * 유저 프로파일 수정
 */
export const postEditProfile = async (req, res) => {
  const { id } = req.session.user;
  const {
    email,
    nickname,
    password,
    tel,
    roadAddress,
    jibunAddress,
    addressDetail,
    latitude,
    longitude,
  } = req.body;
  const user = await User.findOne({ where: { id } });
  if (!user) {
    return res
      .status(400)
      .send(
        "<script>alert('변경하려는 유저 정보를 찾을 수 없습니다!'); window.location.replace('/');</script>"
      );
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    console.log("password incorrect");
    return res
      .status(400)
      .send(
        `<script>alert('패스워드가 틀립니다.'); window.location.replace('/user/${id}/edit');</script>`
      );
  }
  user.nickname = nickname;
  user.tel = tel;
  user.roadAddress = roadAddress;
  user.jibunAddress = jibunAddress;
  user.addressDetail = addressDetail;
  user.latitude = parseFloat(latitude);
  user.longitude = parseFloat(longitude);
  user.save();
  req.session.loggedIn = true;
  req.session.user = user;
  return res.status(200).redirect("/");
};

/**
 * 비밀번호 변경 페이지
 */
export const getChangePassword = (req, res) => {
  let { id: param_id } = req.params;
  let { id: session_id } = req.session.user;
  param_id = toInteger(param_id);
  if (param_id === session_id) {
    return res.render("changePassword", {
      pageTitle: "Change Password",
    });
  } else {
    return res
      .status(400)
      .send(
        "<script>alert('로그인 한 계정과 수정하려는 계정이 일치하지 않습니다!'); window.location.replace('/');</script>"
      );
  }
};

/**
 * 비밀번호 변경 요청 처리
 */
export const postChangePassword = async (req, res) => {
  const { id } = req.session.user;
  const { cur_password, new_password, new_password2 } = req.body;
  let user = await User.findOne({ where: { id } });
  if (!user) {
    return res
      .status(400)
      .send(
        "<script>alert('변경하려는 유저 정보를 찾을 수 없습니다!'); window.location.replace('/');</script>"
      );
  }
  const ok = await bcrypt.compare(cur_password, user.password);
  if (!ok) {
    console.log("password incorrect");
    return res
      .status(400)
      .send(
        `<script>alert('패스워드가 틀립니다.'); window.location.replace('/user/${id}/edit');</script>`
      );
  }
  if (new_password !== new_password2) {
    return res
      .status(400)
      .send(
        "<script>alert('패스워드가 일치하지 않습니다.'); window.location.replace('/join');</script>"
      );
  }
  user.password = new_password;
  user.save();
  return res.status(200).redirect("/");
};

/*
 * 찜한 가계 목록 조회
 */
export const getLikes = async (req, res) => {
  const { id } = req.session.user;
  const likeArr = await Like.findAll({
    attributes: ["store_id"],
    where: {
      user_id: id,
    },
    raw: true,
  });
  const storeIdList = likeArr.map((x) => x.store_id);
  const x = req.session.user.longitude;
  const y = req.session.user.latitude;
  const apiRes = await axios
    .get(`${JJ_IP}/consumer/getLikeStore`, {
      params: { storeIdList },
    })
    .catch(function (error) {
      if (error.response) {
        // req, res 됐으나 res가 에러를 반환시 (status code != 2xx)
        console.log("점주측 서버 에러 - 가계정보 못받아옴", error.response);
        return res.render("likes", { pageTitle: "Likes", stores: [] });
      } else if (error.request) {
        // res 없음, 통신 두절
        console.log("통신 두절 - 가계정보 못받아옴", error.request);
        return res.render("likes", { pageTitle: "Likes", stores: [] });
      } else {
        console.log("Error", error.message);
        return res.render("likes", { pageTitle: "Likes", stores: [] });
      }
    });
  const stores = apiRes.data.answer;
  if (!stores) {
    console.log("가게 정보 null");
    return res.render("likes", { pageTitle: "Likes", stores: [] });
  }
  const reviews = await sequelize.query(
    "SELECT store_id, avg(rating) as rating, count(*) as count FROM reviews GROUP BY store_id",
    { type: QueryTypes.SELECT }
  );
  stores.forEach((store) => {
    const found = reviews.find((review) => review.store_id === store.id);
    if (found) {
      store.rating = parseFloat(found.rating);
      store.rating_count = toInteger(found.count);
    } else {
      store.rating = 0;
      store.rating_count = 0;
    }
    store.distance = getDistanceFromLatLonInKm(
      y,
      x,
      store.latitude,
      store.longitude
    );
  });
  toArray(stores);
  //Like 한 store_id 들 jj로 보내고 관련 store 정보 home화면과 같이 받아온다.
  // let stores = [store1, store2, store3];
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
      .post(`${JJ_IP}/consumer/postDeliveryInfo`, {
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
  const { delivery_id, status } = req.body.data;
  const statusArr = ["주문", "접수", "완료", "완료", "환불", "환불"];
  const cart = await Cart.findOne({
    where: {
      delivery_id,
    },
  });
  if (!cart) {
    console.log("주문내역 발견 실패!!!!");
    return res.status(404);
  }
  if (status === 4 || status === 5) {
    await Review.destroy({
      where: {
        cart_id: cart.id,
      },
    });
  }
  const { subscription } = await User.findOne({
    where: {
      id: cart.user_id,
    },
  });
  if (subscription) {
    // Subscription 저장돼 있을 시 - Log Out 하지 않았으면
    const payload = JSON.stringify({
      title: "First Kitchen",
      body: `주문이 ${statusArr[status]}되었습니다!`,
    });
    webpush
      .sendNotification(subscription, payload)
      .catch((err) => console.error(err));
  }
  return res.status(201).json({});
};

/*
 * 진행중인 주문 상황 조회
 */
export const getCurrentDelivery = async (req, res) => {
  const { id } = req.session.user;
  axios
    .post(`${JJ_IP}/consumer/getProceedingDelivery`, {
      data: { user_id: id },
    })
    .then(function (response) {
      const inDelivery = JSON.parse(response.data.result);
      return res.render("currentDelivery", { inDelivery });
    })
    .catch(function (error) {
      console.log(error);
      return res.redirect("/");
    });
};

/*
 * 과거 주문 내역 조회
 */
export const getPrevDelivery = async (req, res) => {
  const { id } = req.session.user;
  axios
    .get(`${JJ_IP}/consumer/getFinishedDelivery`, {
      params: {
        user_id: id,
      },
    })
    .then(async function (response) {
      const prevDeliveries = JSON.parse(response.data.result);
      for (const delivery of prevDeliveries) {
        const cart = await Cart.findOne({
          where: { delivery_id: delivery.delivery_id },
        });
        delivery.is_reviewed = cart.is_reviewed;
      }
      return res.render("prevDelivery", { prevDeliveries });
    })
    .catch(function (error) {
      console.log(error);
      return res.redirect("/");
    });
};

/*
 * 리뷰 작성 페이지 get
 */
export const getWriteReview = async (req, res) => {
  return res.render("writeReview");
};

/*
 * 리뷰 작성
 */
export const postWriteReview = async (req, res) => {
  const { id: user_id } = req.session.user;
  const { delivery_id } = req.params;
  const cart = await Cart.findOne({ where: { delivery_id } });
  //로그인한 유저와 리뷰 작성할 수 있는 유저 다를 시
  if (cart.user_id !== user_id) {
    return res.status(400).redirect("/");
  }
  const review_content = req.body.review;
  const rating = toInteger(req.body.rating);
  try {
    await Review.create({
      user_id,
      store_id: cart.store_id,
      cart_id: cart.id,
      review_content,
      rating,
    });
    cart.is_reviewed = true;
    cart.save();
  } catch (error) {
    console.log(error);
    return res.status(400).redirect("/");
  }
  //어디로 보내야할까?
  return res.status(200).redirect("/");
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
  console.log("Subscription Received..");
  await User.update(
    { subscription },
    {
      where: {
        id,
      },
    }
  );
  console.log(`User: ${id} subscription updated`);
  res.status(201).json({});
};

export const getMonthlyUser = async (req, res) => {
  const user_count = await sequelize.query(
    "SELECT count(*) as count FROM users where MONTH(createdAt) = MONTH(CURRENT_DATE()) AND YEAR(createdAt) = YEAR(CURRENT_DATE())",
    { type: QueryTypes.SELECT }
  );
  res.send(user_count[0].count);
};
