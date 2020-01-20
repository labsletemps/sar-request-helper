var items = [];
var endpoint = "https://wiki.personaldata.io/w/api.php";

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
		var query = `SELECT ?item ?itemLabel ?email
            				WHERE
            				{
            				    ?item pdiot:P3 pdio:Q991 ; rdfs:label ?itemLabel.
            				    FILTER(STRSTARTS(?itemLabel, "${request.term}")).
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
			console.log(data);
			var items = [];
			for (i in data['results']['bindings']){
				var parts = data['results']['bindings'][i].item.value.split('/');
				var q = parts[parts.length-1];
				items.push({
					'id': q,
					'value': data['results']['bindings'][i].itemLabel.value,
					'label': data['results']['bindings'][i].itemLabel.value,
				});
			}
			console.log(items)
			response( items );

		}
	});

		// wbsearchentities alternative -- not filtered for data xx
		// var params = "?action=wbsearchentities&search=" + request.term + "&language=fr&format=json&origin=*";
		//
		// $.ajax( {
		// 	url: endpoint + params,
		// 	success: function( data ) {
		// 		console.log(data);
		// 		var items = [];
		// 		for (i in data['search']){
		//
		// 			items.push({
		// 				'id': data['search'][i].id,
		// 				'value': data['search'][i].i,
		// 				'label': data['search'][i].label
		// 			});
		// 		}
		// 		response( items );
		// 	}
		// } );
	},
	minLength: 2
} );

$( "#companyInput" ).bind( "autocompleteselect", function(event, ui) {
  console.log(ui)
	var q = ui.item.id;
	console.log(q);
	$.ajax({
		data: {
			action: 'expandtemplates',
			text: '{{MailtoSwissAccess|' + q + '}}',
			format: 'json',
			prop: 'wikitext',
			origin: '*'
		},
		dataType: "json",
		url: endpoint,
		success: function (data) {
			console.log()
				var parameters = new URLSearchParams(data['expandtemplates']['wikitext']);
				var subject = parameters.get('subject');
				var body = parameters.get('body');
				var emailMatch = data['expandtemplates']['wikitext'].match(/mailto:(.*?)\?/);
				var email = emailMatch ? emailMatch[1] : '';

				console.log(data['expandtemplates']['wikitext'])
				console.log(data['expandtemplates'])

				var item = {
					'recipient-email': email,
					key: q,
					subject: subject,
					message: body
				}

				console.log(item);
				createMessage(item);
		},
		error: function (e){
			// Write something in warning div
			console.log(e);
		}
	});
});

// $('.ui-menu-item').click(function(){
// 	console.log($(this))
// })

// Creer le message apres choix dans SELECT ou champ de texte
function createMessage(item){
	/*
	propriétés de "item" / "item" properties:
	- subject (= objet du mail)
	- recipient-email
	- data (= e-mail destinataire)
	- message (= corps e-mail)
	*/
	if( 'recipient-email' in item){
		$('#recipient-email').val(  item['recipient-email'] );
	}
	$('#object').val(  item['subject'] );
	$('#sendMail').attr('href',  item['data'] );

	// Remplacements a faire et a signaler dans le text de l’e-mail
	var message =  item['message'];
	var name = $('#name').val();
	if(name != ''){
	  message = message.replace('<<PRENOM NOM>>', name);
	}
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
$('#sendMail').click(function(){
	// TODO: updater le contenu du message avec objet + textarea
	console.log($(this).val());
});
