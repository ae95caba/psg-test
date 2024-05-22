const { Client } = require("pg");
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();

const client = new Client({
  user: "mathesar",
  host: "mathesar_db", // Use the IP address of your PostgreSQL container
  database: "mathesar",
  password: "mathesar",
  port: "5432", // Use the port mapped to your host machine
});

client.connect((err) => {
  if (err) {
    console.error("connection err", err.stack);
  } else {
    console.log(`connected`);
  }
});

app.get("/get-all", async (req, res) => {
  try {
    console.log(`get all runing`);
    const queryProducts = `
    SELECT productos.id, productos.nombre AS name, productos.agregado_el AS "createdTime", categorias.nombre AS category
    FROM productos
    JOIN categorias ON productos.categoria_id = categorias.id;
  `;
    const resultProducts = await client.query(queryProducts); // replace 'your_table_name' with your table name
    const queryImages = `
    SELECT imagenes.id, imagenes.imagen_url AS url, imagenes.producto_id  AS product_id
    FROM imagenes
    
  `;
    const resultImages = await client.query(queryImages); // replace 'your_table_name' with your table name

    const products = resultProducts.rows;
    const images = resultImages.rows;
    // Step 2: Transform the Data
    const productMap = products.reduce((acc, product) => {
      acc[product.id] = { ...product, images: [] };
      return acc;
    }, {});

    images.forEach((image) => {
      if (productMap[image.product_id]) {
        productMap[image.product_id].images.push({
          url: image.url,
          id: image.id,
        });
      }
    });

    const combinedResult = Object.values(productMap);

    res.json(combinedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
