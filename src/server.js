import express from "express";
import morgan from "morgan";
import rootRouter from "./routers/rootRouter";

const app = express();
const logger = morgan("dev");

const PORT = 4000;

app.set("view engine", "ejs");
app.engine("html", require("ejs").renderFile); // temporarily using html only
app.set("views", process.cwd() + "/src/views");

app.use(logger);
app.use(express.urlencoded({ extended: true })); // for post request encoding

const handleListening = () => {
  console.log(`Server Listening on port: http://localhost:${PORT}`);
};

app.listen(PORT, handleListening);

app.use("/", rootRouter);
