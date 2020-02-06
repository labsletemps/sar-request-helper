var items = [];
var endpoint = "https://wiki.personaldata.io/w/api.php";

class RequestTemplate {
	constructor(id){
		this.id = id;
	}
}

// TODO
// Q1185 = Le Temps
/*var parameters = new URLSearchParams(window.location.search);
var targetEntity = parameters.get('entity');
if(targetEntity){
	var country = parameters.get('country');

}*/


$('#suggestButton').click(function(){
	$('#suggest').show();
})

// ajout des select options a partir du JSON / create select options from JSON
$.ajax({
	url: 'data/companies.json',
	success: function(data){
		$.each(data['data'], function(i, item){
			items.push(item);
			$('#companySelect').append('<option value="' + item['key'] + '">' + item['Recipient'] + '</option>')
		});

	},
	error: function(d){
		console.log('Error - JSON syntax error?')
	}
});

// recherche avec autocompletion / search with autocomplete
$( "#companyInput" ).autocomplete({
	source: function( request, response ) {
		var slug = request.term.toLowerCase();

		// Q991 (swiss data controller) ou Q96 (data controller)

		var query = `SELECT ?item ?itemLabel ?email ?country
			WHERE
			{
				{?item pdiot:P3 pdio:Q96; rdfs:label ?itemLabel.}
				UNION
				{?item pdiot:P3 pdio:Q991; rdfs:label ?itemLabel.}
			  FILTER (CONTAINS(LCASE(?itemLabel), "${slug}")).
			  OPTIONAL{?item pdiot:P55 ?country}
			  OPTIONAL{?item pdiot:P17 ?email .}
			  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],fr". }
			}`;

		$.ajax({
			type: 'GET',
			url: 'https://query.personaldata.io/proxy/wdqs/bigdata/namespace/wdq/?origin=*&query=' + encodeURIComponent(query),
			headers: {
				Accept: 'application/sparql-results+json'
			},
			success: function( data ) {
				var items = [];
				var q_list = [];
				for (i in data['results']['bindings']){

					var parts = data['results']['bindings'][i].item.value.split('/');

					var q = parts[parts.length-1];

					var country = data['results']['bindings'][i].country ? data['results']['bindings'][i].country.value : 'null';

					if( q_list.indexOf(q) < 0 ){ // remove duplicates
						items.push({
							'id': q,
							'value': data['results']['bindings'][i].itemLabel.value,
							'label': data['results']['bindings'][i].itemLabel.value,
							'country': country
						});
						q_list.push(q);
					}
				}
				response( items );

			}
		});
	},
	minLength: 2
} );

// Recherche des donnees sur wiki.personaldata.io
$( "#companyInput" ).bind( "autocompleteselect", function(event, ui) {
	var q = ui.item.id;

	// GPDR or Swiss SAR?
	var swissSAR = false;
	var templateName = 'MailtoAccess';
	if(ui.item.country == 'https://wiki.personaldata.io/entity/Q416'){ // Q416 = Switzerland
		swissSAR = true;
		templateName = 'MailtoSwissAccess';
	}

	$.ajax({
		data: {
			action: 'expandtemplates',
			text: '{{' + templateName + '|' + q + '}}',
			format: 'json',
			prop: 'wikitext',
			origin: '*'
		},
		dataType: "json",
		url: endpoint,
		success: function (data) {

			var parameters = new URLSearchParams(data['expandtemplates']['wikitext']);
			var body = parameters.get('body');
			var subject = 'Subject Access Request';

			if(swissSAR){
				subject = body.split('\n')[0];
				body = $.trim( body.substr( body.indexOf('\n') ) );
			}

			var emailMatch = data['expandtemplates']['wikitext'].match(/mailto:(.*?)\?/);
			var email = emailMatch ? emailMatch[1] : '';

			var item = {
				'recipient': email,
				key: q,
				subject: subject,
				message: body,
				data: data['expandtemplates']['wikitext']
			}
			createMessage(item);
		},
		error: function (e){
			// TODO Write something in warning div
			console.log(e);
		}
	});
});

// Creer le message apres soit choix rapide soit recherche
function createMessage(item){
	/*
	propriétés de "item" / "item" properties:
	- subject (= objet du mail)
	- recipient
	- data (= e-mail destinataire)
	- message (= corps e-mail)
	*/
	if( 'recipient' in item){
		$('#recipient').val(  item['recipient'] );
	}
	$('#object').val(  item['subject'] );
	$('#sendMail').attr('href',  item['data'] );

	// Remplacements a faire et a signaler dans le text de l’e-mail
	var message =  item['message'];
	var name = $('#name').val();
	// if(name != ''){
	// 	message = message.replace('<<PRENOM NOM>>', name);
	// }
	var missingPattern = /.*<<.*>>/g;
	var missingTexts = message.match(missingPattern);
	$('#missingTexts').html('');
	$('#missingTexts').hide();

	if(missingTexts && missingTexts.length > 0){
		$.each( missingTexts, function( index, missingText ){
			$('#missingTexts').append('<li>' + missingText.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</li>');
		});
		$('#missingTexts').show();
	}

	$('#message').val( message );

	$('.result').show(300);
}

// utilisation du SELECT / SELECT change
$('#companySelect').change(function(){
	$('.result').hide(100);
	var key = $(this).val();
	var found;
	$.each(items, function(i, item){
		if(item['key'] == key){
			found = item;
			return;
		}
	});
	if(found){
		createMessage(found);
	}else{
		console.log('not found!')
	}
})

$('#name').change(function(){
	// TODO
});

$('#sendMail').click(function(){
	// TODO: updater le contenu du message avec objet + textarea
	console.log($(this).val());
});

$('.copyValue').click(function(){

	var targetField = $('#' + $(this).data('target'));
  targetField.focus();
  targetField.select();

  try {
    var successful = document.execCommand('copy');
    console.log('Copying result ' + successful);
  } catch (err) {
    console.log('Error while copying');
  }
})
