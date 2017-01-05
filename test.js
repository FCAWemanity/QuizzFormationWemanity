// var http = require("http");

// http.createServer(function (request, response) {
//    // Send the HTTP header 
//    // HTTP Status: 200 : OK
//    // Content Type: text/plain
//    response.writeHead(200, {'Content-Type': 'text/plain'});
   
//    // Send the response body as "Hello World"
//    response.end('Hello World\n');
// }).listen(8081);

// // Console will print the message
// console.log('Server running at http://127.0.0.1:8081/');

var express = require('express');
var fs = require("fs");
var ejs = require('ejs');
var bodyParser = require('body-parser');
var session = require('express-session');

var app = express();

app.use(express.static('public'));
app.use(session({secret: 'tagada tsoin tsoin'}));

// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

// Get content from file
var contents = fs.readFileSync("config.json");
// Define to JSON type
var jsonContent = JSON.parse(contents);

var session;

var formationResearch = function(name){
	var i = 0 ; 
	while(i < jsonContent.length){
		if( name === jsonContent[i].nomVisible ){
			break; 
		}
		i++;
	}
	if( i == jsonContent.length){
		return -1 ;  
	}
	return i; 
}

Array.prototype.compareInt = function(testArr) {
    if (this.length != testArr.length) return false;
    for (var i = 0; i < testArr.length; i++) {
        if (this[i].compare) { //To test values in nested arrays
            if (!this[i].compare(testArr[i])) 
            	return false;
        }
        else if ( parseInt(this[i]) !== parseInt(testArr[i]) ) return false;
    }
    return true;
}

var randomize = function(questionsArray, numberOfQuestions)
{
	return questionsArray; 
}

app.get('/', function (req, res) {
   res.send('Hello World !');
})

app.get('/:nomFormation', function (req, res) {

	console.log(req.params.nomFormation);
	var i = formationResearch(req.params.nomFormation); 
	console.log(i);
	if( i == -1){
		res.send("Erreur : la formation demandée n'existe pas.");
		return; 
	}

	res.writeHead(200, {"Content-Type" : "text/html"});

	fs.readFile( "views/beginTest.html", "utf-8", function(err, pageContent){

		if(err){ console.log("Erreur lors du parsing du fichier de configuration"); return;  }

		var renderedHtml = ejs.render(pageContent, {  
		titre : jsonContent[i].nomVisible, 
		descriptif : jsonContent[i].description,
		rules : jsonContent[i].regles,
		nbQuestions : jsonContent[i].nombreQuestions, 
		nbSecondesQuestion : jsonContent[i].tempsParQuestionSecondes , 
		tpsTotalMin : (jsonContent[i].nombreQuestions * jsonContent[i].tempsParQuestionSecondes) / 60, 
		tpsTotalSec : (jsonContent[i].nombreQuestions * jsonContent[i].tempsParQuestionSecondes) % 60,
		pourcentageReussite : jsonContent[i].pourcentageCertification
	});

    res.end( renderedHtml );
	});
})

app.post('/quizz/:nomFormation', urlencodedParser ,function (req, res){

	var index = formationResearch(req.params.nomFormation);
	if( index == - 1){
		res.send("Erreur : la formation demandée n'existe pas"); 
		return; 
	}
	var formation = jsonContent[index] ; 
	var questionsFull = JSON.parse( fs.readFileSync(formation.path) ); 
	questionsFull = randomize(questionsFull, formation.nombreQuestions); 

	session = req.session;
	session.email = req.body.email; 
	session.surname = req.body.surname;
	session.lastname = req.body.lastname;
	session.questionsArray = questionsFull;
	session.questionTime = formation.tempsParQuestionSecondes;
	session.indexInQuestionsArray = 0;
	session.goodResponses = 0; 

	res.sendFile( __dirname + "/views/quizz.html" );
	//console.log(questionsFull); 
})

var sendCurrentQuestion = function(){
	return { 
		numberOfQuestions : session.questionsArray.length,
		currentNumber : session.indexInQuestionsArray + 1, 
		currentQuestion : session.questionsArray[session.indexInQuestionsArray].intitule, 
		currentChoices : session.questionsArray[session.indexInQuestionsArray].reponses,
		currentQuestionMultipleAnswers : session.questionsArray[session.indexInQuestionsArray].choixMultiples, 
		questionId : session.questionsArray[session.indexInQuestionsArray].id, 
		questionTime : session.questionTime
	};
}

app.get("/quizz/firstQuestion", function (req, res){
	res.send(sendCurrentQuestion()); 
});

app.get("/quizz/nextQuestion*", function (req, res){
	console.log("yo");
	console.log(req.query.array);
	console.log(session.questionsArray[session.indexInQuestionsArray].reponsesCorrectes);
	if( req.query.array.compareInt( session.questionsArray[session.indexInQuestionsArray].reponsesCorrectes.sort() ) ){
		session.goodResponses++;
		console.log("ouiiiiiiiiii");
	}

	console.log(session.goodResponses);

	session.indexInQuestionsArray ++; 
	res.send(sendCurrentQuestion()); 		
});

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
}); 