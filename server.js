/*Esta variable contiene la información que expone el framwork Express*/
var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser"); //Para parsear el cuerpo de una solicitud
var multer = require("multer"); //Para poder subir archivos
var cloudinary = require("cloudinary"); //Para usar el servicio de imagenes de cloudinary
var app_password = "12345678"
var method_override = require("method-override");
var Schema = mongoose.Schema;

/*Configurando cloudinary con los datos de m cuenta*/
cloudinary.config({
	cloud_name:"buirai",
	api_key:"938214117581154",
	api_secret:"uhzZb95jwRdWTh9lEXwacRyVYL0"
});

var app = express();

/*Conexión al MongoDB*/
mongoose.connect("mongodb://localhost/primera_pagina");

/*Utilizamos body parser para parsear los paramtros que vengan en una
peticion post y get*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.use(multer({dest : "./uploads"})); //dest: la ruta
app.use(method_override("_method"));

/*Definir el esquema de los productos*/
var productSchemaJSON = {
	title:String,
	description:String,
	imageURL:String,
	pricing:Number
};
//Para agregar un atributo virtual al producto (en este caso un get)
var productSchema = new Schema(productSchemaJSON);
//Agregar un atributo virtual al productSchema (get)
productSchema.virtual("image.url").get(function(){
	/*Si this (este producto) no tiene una imagen, su modo get
	retornara "data.jpg"*/
	if(this.imageURL === "" || this.imageURL === "data.jpg"){
		return "data.jpg";
	/*Sí this (este producto) tiene imagen retornara la url de la imagen*/
	}else{
		return this.imageURL;
	}
});

var Product = mongoose.model("Product", productSchema);

/*Decirle a la variable app que el engine de las vistas será
Jade*/
app.set("view engine", "jade");

/*Seleccionando un directorio para alojar los assets*/
app.use(express.static("public"))

app.get("/", function(request, response){
	response.render("index");
});

app.get("/menu", function(request, response){
	Product.find(function(error, documento){
		if (error) { console.log(error); }
		response.render("menu/index", { products : documento })
	});
});

/*Método PUT para editar un producto*/
app.put("/menu/:id", function(request, response){
	if (request.body.password = app_password) {
		var data = {
			title: request.body.title,
			description: request.body.description,
			pricing: request.body.pricing
		};
		//Si tiene imagen el producto
		if (request.files.hasOwnProperty("image_avatar")) {
			cloudinary.uploader.upload(request.files.image_avatar.path, 
				//la siguiente función se ejcuta tras completar la subida de la imagen
				function(result) { 
					data.imageURL = result.url;
					//Query para avtualizar un producto a la base de datos
					Product.update({"_id": request.params.id}, data, function(product){
						response.redirect("/menu");
					});
				}
			);	
		//Si no tiene imagen el producto
		}else{
			//Query para avtualizar un producto a la base de datos
			Product.update({"_id": request.params.id}, data, function(product){
				response.redirect("/menu");
			});
		}
	}else{
		response.redirect("/");
	}
});

app.get("/menu/edit/:id", function(request, response){
	var id_product = request.params.id;
	console.log(id_product);
	/*Query para encontrar un solo objeto de la base de datos*/
	Product.findOne({"_id" : id_product}, function(error, product_query){
		console.log(product_query);
		response.render("menu/edit", {product : product_query});
	});
});

app.post("/admin", function(request, response){
	if(request.body.password == app_password){
		/*Ahora un query para buscar todos los objetos producto*/
		Product.find(function(error, documento){
			if (error) { console.log(error); }
			response.render("admin/index", { products : documento })
		});
	}else{
		response.redirect("/");
	}
});

app.get("/admin", function(request, response){
	response.render("admin/form");
});

/*Método POST para agregar un producto*/
app.post("/menu", function(request, response){
	if (request.body.password == app_password) {
		var data = {
			title: request.body.title,
			description: request.body.description,
			pricing: request.body.pricing
		}
		var product = new Product(data);
		//Primero verifica que el producto tenga imagen
		if (request.files.hasOwnProperty("image_avatar")){
			cloudinary.uploader.upload(request.files.image_avatar.path, 
				//la siguiente función se ejcuta tras completar la subida de la imagen
				function(result) { 
					console.log(result);
					product.imageURL = result.url;
					/*Query para guardar algo en la base de datos*/
					product.save(function(err){
						console.log(product);
						response.redirect("/menu");
					});
				}
			);
		//Si no tiene imagen se guarda sin ella
		}else{
			product.save(function(err){
				console.log(product);
				response.redirect("/menu");
			});
		}
	}else{
		response.render("menu/new");
	}
});

app.get("/menu/new", function(request, response){
	response.render("menu/new");
});

/*Para borrar un producto*/
app.get("/menu/delete/:id", function(request, response){
	var id = request.params.id;
	/*Query para encontrar un producto*/
	Product.findOne({"_id" : id}, function(error, product_query){
		response.render("menu/delete",{product : product_query});
	});
});

/*Para confirmar el borrado de un producto*/
app.delete("/menu/:id", function(request, response){
	var id = request.params.id;
	if (request.body.password == app_password) {
		/*Query para eliminar un producto*/
		Product.remove({"_id" : id}, function(error){
			if (error) { console.log(error); }
			response.redirect("/menu");
		});
	}else{
		response.redirect("/menu");
	}
});

/*Iniciando el servidor con el puerto 8080*/
app.listen(8080);