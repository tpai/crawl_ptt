$(document).ready(function(){ 
	$("body").html($("body").html()+'<a href="#" class="scrollup">Scroll</a>');
	$(window).scroll(function(){
		if ($(this).scrollTop() > 100) {
			$('.scrollup').fadeIn();
		} else {
			$('.scrollup').fadeOut();
		}
	});
	$(".scrollup").show(0);
	$('.scrollup').click(function(){
		$("html, body").animate({ scrollTop: 0 }, 600);
		$('.scrollup').blur();
		return false;
	});
});