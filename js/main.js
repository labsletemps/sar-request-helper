
var items = [];
var endpoint = "https://wiki.personaldata.io/w/api.php";

// liste rapide
$.ajax({
	url: 'data/companies.json',
	success: function(data){
		$.each(data['data'], function(i, item){
			items.push(item);
			$('#companySelect').append('<option value="' + item['key'] + '">' + item['Recipient'] + '</option>')
		});

	},
	error: function(d){
		console.log('Error - malformed json?')
	}
});

// champ de texte avec autocomplete
$( "#companyInput" ).autocomplete({
	source: function( request, response ) {
		var params = "?action=wbsearchentities&search=" + request.term + "&language=fr&format=json&origin=*";

		$.ajax( {
			url: endpoint + params,
			success: function( data ) {
				var items = [];
				for (i in data['search']){
					items.push({
						'id': data['search'][i].id,
						'value': data['search'][i].i,
						'label': data['search'][i].label
					});
				}
				response( items );
			}
		} );
	},
	minLength: 2
} );


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
		$('#object').val( found['subject'] );
		$('#sendMail').attr('href', found['data'] );

		// Remplacements a faire et a signaler dans le text de l’e-mail
		var message = found['message'];
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
	}else{
		console.log('not found!')
	}

})
$('#sendMail').click(function(){
	console.log($(this).val());
});
