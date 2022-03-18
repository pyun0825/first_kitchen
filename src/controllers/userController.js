import bcrypt from "bcrypt";
import { User } from "../../models";

export const home = (req, res) => {
  // 필요한 가계 정보 받아서 출력
  // store = {store_id, storeName, storeAddress, isOpen}
  const store1 = {
    store_id: 1,
    storeName: "Hell's Kitchen",
    storeAddress: "고려대로28",
    isOpen: true,
  };
  const store2 = {
    store_id: 2,
    storeName: "Burger King",
    storeAddress: "안암로123",
    isOpen: true,
  };
  const store3 = {
    store_id: 3,
    storeName: "안암꼬치",
    storeAddress: "안암로1223",
    isOpen: false,
  };
  let stores = [store1, store2, store3];
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
    return res.status(400).render("login");
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    console.log("password incorrect");
    return res.status(400).render("login");
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
    return res.status(400).render("join");
  }
  const exists = await User.findOne({
    where: {
      email,
    },
  });
  if (exists) {
    console.log("Account already exists with corresponding email");
    return res.status(400).render("join");
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
