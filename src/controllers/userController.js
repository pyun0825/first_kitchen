import bcrypt from "bcrypt";
import { User } from "../../models";

export const home = (req, res) => {
  return res.render("home.html");
};

export const getLogin = (req, res) => {
  return res.render("login.html");
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
    return res.status(400).render("login.html");
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    console.log("password incorrect");
    return res.status(400).render("login.html");
  }
  req.session.loggedIn = true;
  req.session.user = user;
  return res.redirect("/");
};

export const getJoin = (req, res) => {
  return res.render("join.html");
};

export const postJoin = async (req, res) => {
  const { email, nickname, password, password2, tel } = req.body;
  if (password !== password2) {
    return res.status(400).render("join.html");
  }
  const exists = await User.findOne({
    where: {
      email,
    },
  });
  if (exists) {
    console.log("Account already exists with corresponding email");
    return res.status(400).render("join.html");
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
    return res.status(400).render("join.html");
  }
};

export const logout = (req, res) => {
  req.session.destroy();
  return res.redirect("/");
};
