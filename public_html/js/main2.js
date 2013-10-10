function MainViewModel(){
    var self = this;
    self.hostName = ko.observable("http://lprpgapi.herokuapp.com");
    self.questionsURI = self.hostName() + "/questions/";
    self.tokensURI =  self.hostName() + "/tokens/";
    self.ajax = function(uri, method, data) {
            var request = {
                url: uri,
                type: method,
                contentType: "application/json",
                accept: "application/json",
                cache: false,
                dataType: 'json',
                
                error: function(jqXHR) {
                    console.log("ajax error " + jqXHR.status);
                }
            };
            
            if(data){
                if(data.daItem.hasOwnProperty('etag')){
                    request.headers = {'If-Match':data.daItem.etag};
                    delete(data.daItem.etag);
                }
                request.data = JSON.stringify(data);
            }
            if(method == 'DELETE'){
                delete(request.data);
            }
            
            return $.ajax(request);
        };
}

function TokenListViewModel() {
    var self = this;
    
    self.setToken = function(token) {
            self.token = token;
    };
    self.beginDelete = function(token){
       
        var data = {daItem:{
                _id:token._id(),
                etag:token.etag(),
        }};
        mainViewModel.ajax(token.getUri(), 'DELETE', data).done(function(res) {
            self.deleteToken(data);
        }); 
    };
   self.deleteToken = function(data){
       var dataId = data.daItem._id;
     
       for(var i=0; i<self.tokens().length; i++){
           var tokenId = self.tokens()[i]._id(); 
          
           if(tokenId == dataId){
               
               self.tokens.remove(self.tokens()[i]);
               break;
           }
       }
   };
   self.prepareAdd = function(){
        self.newToken._id('new');
        self.newToken.text('new token');
        self.newToken.shortcode('NT');
        self.newToken.color('bbbbbb');
   };
    self.beginAdd = function(){ 
        self.prepareAdd();
        $('#myTModal').modal('toggle');
    };
    self.add = function(daToken){
        var data = {daItem:{
                text:daToken.text(),
                shortcode:daToken.shortcode(),
                color:$('#newclr_'+daToken._id()).val().replace('#','')                
        }};
         mainViewModel.ajax(mainViewModel.tokensURI, 'POST', data).done(function(res) {
            self.addNewToken(res);
        });
        $('#myTModal').modal('toggle');
    };
    self.addNewToken = function(res){
        
        self.newToken._id(res.daItem._id);
        self.newToken.etag(res.daItem.etag);
        
        self.tokens.push(self.newToken);
    };
    self.beginEdit = function(token) {
        self.setToken(token);
        $('#cp_'+self.token._id()).colorpicker();
    };
            
    self.edit = function(token) {
        var data = {daItem:{
            text: $('#edittxt_'+token._id()).val(),
            etag: token.etag(),
            color: $('#editclr_'+token._id()).val().replace('#',''),
            shortcode:$('#editsc_'+token._id()).val()
        }        
        };
       
        mainViewModel.ajax(token.getUri(), 'PATCH', data).done(function(res) {
            self.updateToken(token, res, data);
        });
        $('#'+token.getEditDivId()).collapse('toggle');
    };
    self.remove = function(token) {
        mainViewModel.ajax(token.getUri(), 'DELETE').done(function() {
            self.tokens.remove(token);
        });
    };
    self.updateToken = function(token, newToken, data) {                
        var i = self.tokens.indexOf(token);
       
        self.tokens()[i].text(data.daItem.text);
        self.tokens()[i].color(data.daItem.color);
        self.tokens()[i].shortcode(data.daItem.shortcode);
        self.tokens()[i].etag(newToken.daItem.etag);
    };
    self.tokens = ko.observableArray();   
    mainViewModel.ajax(mainViewModel.tokensURI, 'GET').done(function(data) {
        for (var i = 0; i < data.length; i++) {
            var token = data[i];
            var tokenObj = new TokenViewModel();
            tokenObj._id(token._id);
            tokenObj.text(token.text);
            tokenObj.etag(token.etag);
            tokenObj.shortcode(token.shortcode);
            tokenObj.color(token.color);
            self.tokens.push(tokenObj);
                           
            }
        });   
    self.newToken = new TokenViewModel();
    self.prepareAdd();    
    ko.applyBindings(self.newToken, $('#myTModal')[0]);
    $('#newcp_new').colorpicker();
}

function QuestionListViewModel(){
    var self = this;
    
    self.questions = ko.observableArray();
    
     self.beginEdit = function(question) {
        self.setQuestion(question);       
    };
    self.setQuestion = function(question) {
            self.question = question;
    };
    self.beginEdit = function(question) {
        self.setQuestion(question);
       
    };    
    self.edit = function(question) {
        var data = {daItem:{
            text: $('#editQT_'+question._id()).val(),
            results: question.getSubmittableResults(),
            etag: question.etag()
        }};
        mainViewModel.ajax(question.getUri(), 'PATCH', data).done(function(res) {
            self.updateQuestion(question, res, data);
        });
        
    };
    self.updateQuestion = function(question, newQuestion, data) {                
        var i = self.questions.indexOf(question);
        
        self.questions()[i].text(data.daItem.text);
        // TODO make this a little more secure. Right now the values just remain the same as entered without verification.
        //self.questions()[i].parseResults(data.daItem.results)
        self.questions()[i].etag(newQuestion.daItem.etag);
        $('#'+question.getEditDivId()).collapse('toggle');
    };
    self.beginDelete = function(question){
        
        var data = {daItem:{
                _id:question._id(),
                etag:question.etag(),
        }};
        mainViewModel.ajax(question.getUri(), 'DELETE', data).done(function(res) {
            self.deleteQuestion(data);
        }); 
    };
   self.deleteQuestion = function(data){
       var dataId = data.daItem._id;
       
       for(var i=0; i<self.questions().length; i++){
           var questionId = self.questions()[i]._id(); 
           
           if(questionId == dataId){               
               self.questions.remove(self.questions()[i]);
               break;
           }
       }
   };
   self.prepareAdd = function(){
        self.newQuestion._id('new');
        self.newQuestion.text('new question');
        for(var i=0; i<tokenListViewModel.tokens().length;i++){
            var token =tokenListViewModel.tokens()[i];
           
            var daResult = new QuestionResultViewModel();
            daResult.yes('0');
            daResult.no('0');
            daResult.token(token);
           
            self.newQuestion.results.push(daResult);
        }
       
   };
    self.beginAdd = function(){ 
        self.prepareAdd();
        $('#myQModal').modal('toggle');
    };
    self.add = function(daQuestion){
        var data = {daItem:{
                text:daQuestion.text(),
                results: daQuestion.getSubmittableResults()
        }};
        
         mainViewModel.ajax(mainViewModel.questionsURI, 'POST', data).done(function(res) {
            self.addNewQuestion(res);
        });
        $('#myQModal').modal('toggle');
      
    };
    self.addNewQuestion = function(res){        
        self.newQuestion._id(res.daItem._id);
        self.newQuestion.etag(res.daItem.etag);
       
        self.questions.push(self.newQuestion);
    };
    
    mainViewModel.ajax(mainViewModel.questionsURI, 'GET').done(function(data) {
        for (var i = 0; i < data.length; i++) {
            var questionObj = new QuestionViewModel();
            var question = data[i];                
            questionObj._id(question._id),
            questionObj.text(question.text);
            questionObj.etag(question.etag);
            questionObj.parseResults(question.results); 
            self.questions.push(questionObj);
        }
    });
    self.newQuestion = new QuestionViewModel();
    self.prepareAdd();    
    ko.applyBindings(self.newQuestion, $('#myQModal')[0]);
    $('#newcp_new').colorpicker();
}

function TokenViewModel(){
    var self=this;
    self._id = ko.observable('id');
    self.text = ko.observable('text');
    self.etag = ko.observable('etag');
    self.color = ko.observable('color');
    self.shortcode = ko.observable('shortcode'); 
    self.getColor = ko.computed({read:function(){ return "#"+self.color();},write: function(value){ self.color(value.replace('#',''));}});
    self.getText= ko.computed(function(){return self.text();});
    self.getShortcode= ko.computed(function(){return self.shortcode();});
    self.getEditDivId= ko.computed(function(){return "edit_"+self._id();});
    self.getUri= ko.computed(function(){return mainViewModel.tokensURI + self._id()+"/"; });
    self.addNew = function(){tokenListViewModel.add(this);};
                    
}

function QuestionViewModel(){
    var self=this;
    self._id = ko.observable('id');
    self.text = ko.observable('text');
    self.etag = ko.observable('etag');
    self.results = ko.observableArray();
    self.getText= ko.computed(function(){return self.text();});
    self.getEditDivId = ko.computed(function(){return "edit_"+self._id();});
    self.getUri = ko.computed(function(){return mainViewModel.questionsURI + self._id()+"/"; });
    self.addNew = function(){questionListViewModel.add(this);};
    self.parseResults = function(res){
        for(j=0;j<tokenListViewModel.tokens().length;j++){
             var token = tokenListViewModel.tokens()[j];
             var result = new QuestionResultViewModel();
             result.token(token);
             for(var i=0; i<res.length;i++){
                var tokenId = res[i].token;
                if( token._id() === tokenId){
                    result.yes(res[i].yes);
                    result.no(res[i].no);
                }           
             }
             self.results.push(result);
        }
        
    };
    self.getSubmittableResults = function(){
        
        var data = [];
        for (var i=0; i<self.results().length;i++){
            var result ={                
                token: self.results()[i].token()._id(),
                yes: parseInt(self.results()[i].yes()),
                no: parseInt(self.results()[i].no())
            };
            data.push(result);
        }
        return data;
    };
                
}
function QuestionResultViewModel(){
    var self = this;
    self.yes = ko.observable('0');
    self.no = ko.observable('0');
    self.token = ko.observable(new TokenViewModel());
    self.getYes = ko.computed(function(){return self.yes();});
    self.getNo = ko.computed(function(){return self.no();});
}


ko.bindingHandlers.jqButton = {
    init: function(element) {
       $(element).button(); // Turns the element into a jQuery UI button
    },
    update: function(element, valueAccessor) {
        var currentValue = valueAccessor();
        // Here we just update the "disabled" state, but you could update other properties too
        $(element).button("option", "disabled", currentValue.enable === false);
    }
};


// Activates knockout.js
var mainViewModel = new MainViewModel();
var tokenListViewModel = new TokenListViewModel();
var questionListViewModel = new QuestionListViewModel();
ko.applyBindings(mainViewModel,$('#main')[0]);
ko.applyBindings(tokenListViewModel,$('#tokens')[0]);
ko.applyBindings(questionListViewModel,$('#questions')[0]);