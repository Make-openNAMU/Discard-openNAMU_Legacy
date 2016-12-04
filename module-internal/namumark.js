module.exports = function(req, n, ba){
  var fs = require('fs');
  var six = n;
  var today = getNow();
  var parseNamu = require('./namumark')
//  var plugin = require('./plugin/plugin.js')
  var d = require('debug')('openNAMU:parser');
  var htmlencode = require('htmlencode');
  var katex = require('parse-katex');
  var xssFilters = require('xss-filters');
  
  function getNow() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; 
  var yyyy = today.getFullYear();
  if(dd<10) {
      dd='0'+dd;
  }
  if(mm<10) {
      mm='0'+mm;
  }
  return yyyy+'/' + mm+'/'+dd;
  }
  six = '\r\n' + six + '\r\n';

  six = six.replace(/<(span(\s[^>]+)?)>/ig, '[$1]');
  six = six.replace(/<(font(\s[^>]+)?)>/ig, '[$1]');
  six = six.replace(/<(iframe(\s[^>]+)?)>/ig, '[$1]');
  six = six.replace(/<(big)>/ig, '[$1]');
  six = six.replace(/<(small)>/ig, '[$1]');
  six = six.replace(/<(del)>/ig, '[$1]');
  six = six.replace(/<(s)>/ig, '[$1]');
  
  six = six.replace(/<(\/span)>/ig, '[$1]');
  six = six.replace(/<(\/font)>/ig, '[$1]');
  six = six.replace(/<(\/iframe)>/ig, '[$1]');
  six = six.replace(/<(\/big)>/ig, '[$1]');
  six = six.replace(/<(\/small)>/ig, '[$1]');
  six = six.replace(/<(\/del)>/ig, '[$1]');
  six = six.replace(/<(\/s)>/ig, '[$1]');
  
  /* 추가 파싱 */
  six = six.replace(/<(table\s?bordercolor=(?:\w+))>/ig, '[$1]');
  six = six.replace(/<(table\s?bordercolor=(?:#[0-9a-f-A-F]{3}))>/ig, '[$1]');
  six = six.replace(/<(table\s?bordercolor=(?:#[0-9a-f-A-F]{6}))>/ig, '[$1]');
  six = six.replace(/<(table\s?width=(?:[^>]*))>/ig, '[$1]');
  six = six.replace(/<(table\s?height=(?:[^>]*))>/ig, '[$1]');
  six = six.replace(/<(table\s?align=(?:[^>]*))>/ig, '[$1]');
  six = six.replace(/<(table\s?textalign=(?:[^>]*))>/ig, '[$1]');
  six = six.replace(/<(table\s?bgcolor=(?:\w+))>/ig, '[$1]');
  six = six.replace(/<(table\s?bgcolor=(?:#[0-9a-f-A-F]{3}))>/ig, '[$1]');
  six = six.replace(/<(table\s?bgcolor=(?:#[0-9a-f-A-F]{6}))>/ig, '[$1]');
  six = six.replace(/<(bgcolor=(?:\w+))>/ig, '[$1]');
  six = six.replace(/<(bgcolor=(?:#[0-9a-f-A-F]{3}))>/ig, '[$1]');
  six = six.replace(/<(bgcolor=(?:#[0-9a-f-A-F]{6}))>/ig, '[$1]');
  six = six.replace(/<(-(?:[0-9]+))>/ig, '[$1]');
  six = six.replace(/<(\|(?:[0-9]+))>/ig, '[$1]');
  /* ----------- */
  
  six = xssFilters.inHTMLData(six);
  
  six = six.replace(/{{\|((?:[^|]*)\n?(?:(?:(?:(?:(?:[^|]*)(?:\n)?)+))))\|}}/g, "<table><tbody><tr><td>$1</td></tr></tbody></table>");
  
  /* 모니위키 및 추가 파싱 부분 */
  six = six.replace(/\[(table\s?bordercolor=(?:\w+)|table\s?bordercolor=(?:#[0-9a-f-A-F]{3})|table\s?bordercolor=(?:#[0-9a-f-A-F]{6})|table\s?width=(?:[^\]]*)|table\s?align=(?:[^\]]*)|table\s?bgcolor=(?:\w+)|table\s?bgcolor=(?:#[0-9a-f-A-F]{3})|table\s?bgcolor=(?:#[0-9a-f-A-F]{6})|\:|\(|\)|bgcolor=(?:\w+)|bgcolor=(?:#[0-9a-f-A-F]{3})|bgcolor=(?:#[0-9a-f-A-F]{6})|-(?:[0-9]+)|\|(?:[0-9]+))\]/ig, '<$1>');
  
  six = six.replace(/\[\[youtube\(([^)]*)\)\]\]/ig, "[youtube($1)]");
  six = six.replace(/\[\[include\(([^)]*)\)\]\]/ig, "[include($1)]");
  
  six = six.replace(/\[\[(?:목차|tableofcontents)\]\]/ig, "[목차]");
  six = six.replace(/\[\[(?:각주|footnote)\]\]/ig, "[각주]");
  
  six = six.replace(/attachment:((?:[^.]*)\.(?:jpg|png|gif|jpeg))/ig, "http://rigvedawiki.net/w/%EC%95%84%EC%9D%B4%ED%8F%B0%207?action=download&value=$1");
  
  six = six.replace(/\[yt\(([^)]*)\)\]/ig, "[youtube($1)]");
  six = six.replace(/\[in\(([^)]*)\)\]/ig, "[include($1)]");
  
  six = six.replace(/{{{#!html\s?/ig, "");
  
  six = six.replace(/{{{#!wiki\s?([^\n]*)\n/ig, "<div $1>");
  
  var folding = /{{{#!folding\s?([^\n]*)/;
  var fold;
  var j = 0;
  while(true) {
	  j = j + 1;
	  if(fold = folding.exec(six)) {
		  if(fold[1]) {
			six = six.replace(folding, "<div style=\"border: 1px solid;background: #f5f5f5;\" class=\"folding-area\"><div class=\"folding\"><div style=\"padding: 10px;\" onclick=\"var f=document.getElementById('folding_" + j + "');var s=f.style.display=='block';f.style.display=s?'none':'block';this.className=s?'':'opened';\">$1</div><div id=\"folding_" + j + "\" style=\"display: none;\"><div style=\"padding: 10px;\"><br>");
		  }
		  else {
			six = six.replace(folding, "<div style=\"border: 1px solid;background: #f5f5f5;\" class=\"folding-area\"><div class=\"folding\"><div style=\"padding: 10px;\" onclick=\"var f=document.getElementById('folding_" + j + "');var s=f.style.display=='block';f.style.display=s?'none':'block';this.className=s?'':'opened';\"><br></div><div id=\"folding_" + j + "\" style=\"display: none;\"><div style=\"padding: 10px;\"><br>");
		  }
	  }
	  else {
		  break;
	  }
  }
  six = six.replace(/&}}}/g, '</div></div></div></div>');
  
  six = six.replace(/{{{(#[0-9a-f-A-F]{6})\s?/ig, "<span style#is#\"color:$1;\">");
  six = six.replace(/{{{(#[0-9a-f-A-F]{3})\s?/ig, "<span style#is#\"color:$1;\">");
  six = six.replace(/{{{#(\w+)\s?/ig, "<span style#is#\"color:$1;\">");
  
  six = six.replace(/{{{\+([1-5])\s?/g, "<span class#is#\"font-size-$1\">");
  six = six.replace(/{{{\-([1-5])\s?/g, "<span class#is#\"font-size-small-$1\">");
  
  six = six.replace(/\+}}}/g, "</span>");
  six = six.replace(/\-}}}/g, "</span>");
  
  six = six.replace(/#}}}/g, "</span>");
  
  six = six.replace(/#!}}}/g, "</div>");
  
  six = six.replace(/}}}/g, "");
  
  var table = /\n{\|([^\n]*)/;
  var td1 = /<table\s?bordercolor=(\w+)>/;
  var td2 = /<table\s?bordercolor=(#[0-9a-f-A-F]{3})>/i;
  var td3 = /<table\s?bordercolor=(#[0-9a-f-A-F]{6})>/i;
  var td4 = /<table\s?width=([^>]*)>/i;
  var td5 = /<table\s?align=([^>]*)>/i;
  var td9 = /<table\s?textalign=([^>]*)>/i;
  var td6 = /<table\s?bgolor=(\w+)>/i;
  var td7 = /<table\s?bgcolor=(#[0-9a-f-A-F]{3})>/i;
  var td8 = /<table\s?bgcolor=(#[0-9a-f-A-F]{6})>/i;
  var style;
  var tdcell;
  var cell;
  var allstyle = 'style="';
  while(true) {
	  if(style = table.exec(six)) {
		  if(style[1]) {
			  if(tdcell = td3.exec(style[1])) {
				  allstyle = allstyle + 'border: 2px solid ' + tdcell[1] + ';';
				  style[1] = style[1].replace(td3, '');
			  }
			  else if(tdcell = td2.exec(style[1])) {
				  allstyle = allstyle + 'border: 2px solid ' + tdcell[1] + ';';
				  style[1] = style[1].replace(td2, '');
			  }
			  else if(tdcell = td1.exec(style[1])) {
				  allstyle = allstyle + 'border: 2px solid ' + tdcell[1] + ';';
				  style[1] = style[1].replace(td1, '');
			  }
			  
			  if(tdcell = td8.exec(style[1])) {
				  allstyle = allstyle + 'background: ' + tdcell[1] + ';';
				  style[1] = style[1].replace(td8, '');
			  }
			  else if(tdcell = td7.exec(style[1])) {
				  allstyle = allstyle + 'background: ' + tdcell[1] + ';';
				  style[1] = style[1].replace(td7, '');
			  }
			  else if(tdcell = td6.exec(style[1])) {
				  allstyle = allstyle + 'background: ' + tdcell[1] + ';';
				  style[1] = style[1].replace(td6, '');
			  }
			 
		 	  if(tdcell = td4.exec(style[1])) {				  
				  allstyle = allstyle + 'width: ' + tdcell[1] + ';';
				  style[1] = style[1].replace(td4, '');
			  }
			  
			  if(tdcell = td5.exec(style[1])) {
				  if(tdcell[1] === 'right') {
					  allstyle = allstyle + 'margin-left:auto;';
				  }
				  else if(tdcell[1] === 'center') {
					  allstyle = allstyle + 'margin:auto;';
				  }
				  style[1] = style[1].replace(td5, '');
			  }
			  
			  if(tdcell = td9.exec(style[1])) {
				  if(tdcell[1] === 'right') {
					  allstyle = allstyle + 'text-align: right;';
				  }
				  else if(tdcell[1] === 'center') {
					  allstyle = allstyle + 'text-align: center;';
				  }
				  style[1] = style[1].replace(td9, '');
			  }
			  
			  six = six.replace(table, "\n<table " + allstyle + "\"><tbody><tr>");
			  allstyle = 'style="';
		  }
		  else {
			  six = six.replace(table, "\n<table><tbody><tr>");
		  }
	  }
	  else {
		  break;
	  }
  }
  six = six.replace(/\n\|-/g, "</tr><tr>");
  six = six.replace(/\n\|}/g, "</tr></tbody></table>");
  
  
  var table2 = /\n\|((?:(?:(?:(?:<\|(?:[0-9]+)>)*[^\|\[\n]))*)\|)?([^\n]*)/;
  var style2;
  var tr1 = /<\:>/;
  var tr2 = /<\(>/;
  var tr3 = /<\)>/;
  var tr4 = /<width=([^>]*)>/i;
  var tr5 = /<height=([^>]*)>/i;
  var tr6 = /<bgcolor=(\w+)>/i;
  var tr7 = /<bgcolor=(#[0-9a-f-A-F]{3})>/i;
  var tr8 = /<bgcolor=(#[0-9a-f-A-F]{6})>/i;
  var tr9 = /<-([0-9]+)>/i;
  var tr10 = /<\|([0-9]+)>/i;
  var trcell;
  var allstyle2 = 'style="';
  while(true) {
	  if(style2 = table2.exec(six)) {
		  if(style2[1]) {
			  if(trcell = tr1.exec(style2[1])) {
				  allstyle2 = allstyle2 + 'text-align: center;';
				  style2[1] = style2[1].replace(tr1, '');
			  }
			  else if(trcell = tr2.exec(style2[1])) {
				  style2[1] = style2[1].replace(tr2, '');
			  }
			  else if(trcell = tr3.exec(style2[1])) {
				  allstyle2 = allstyle2 + 'text-align: right;';
				  style2[1] = style2[1].replace(tr3, '');
			  }
			  
			  if(trcell = tr4.exec(style2[1])) {
				  allstyle2 = allstyle2 + 'width: ' + trcell[1] + ';';
				  style2[1] = style2[1].replace(tr4, '');
			  }
			  if(trcell = tr5.exec(style2[1])) {
				  allstyle2 = allstyle2 + 'height: ' + trcell[1] + ';';
				  style2[1] = style2[1].replace(tr5, '');
			  }
			  
			  if(trcell = tr8.exec(style2[1])) {
				  allstyle2 = allstyle2 + 'background: ' + trcell[1] + ';';
				  style2[1] = style2[1].replace(tr8, '');
			  }
			  else if(trcell = tr7.exec(style2[1])) {
				  allstyle2 = allstyle2 + 'background: ' + trcell[1] + ';';
				  style2[1] = style2[1].replace(tr7, '');
			  }
			  else if(trcell = tr6.exec(style2[1])) {
				  allstyle2 = allstyle2 + 'background: ' + trcell[1] + ';';
				  style2[1] = style2[1].replace(tr6, '');
			  }
			  
			  if(trcell = tr9.exec(style2[1])) {
				  allstyle2 = 'colspan="' + trcell[1] + '" ' + allstyle2;
				  style2[1] = style2[1].replace(tr9, '');
			  }
			  if(trcell = tr10.exec(style2[1])) {
				  allstyle2 = 'rowspan="' + trcell[1] + '" ' + allstyle2;
				  style2[1] = style2[1].replace(tr10, '');
			  }
			  
			  six = six.replace(table2, "<td " + allstyle2 + "\">$2</td>");
			  allstyle2 = 'style="';
		  }
		  else {
			  six = six.replace(table2, "<td $1>$2</td>");
		  }
	  }
	  else {
		  break;
	  }
  }
  /* 끝 */
  
  var ohhhh = /\n>\s?((?:[^\n]*)(?:(?:(?:(?:\n>\s?)(?:[^\n]*))+)?))/;
  var read;
  while(true)
  {
	  if(read = ohhhh.exec(six))
	  {
		read[1] = read[1].replace(/\n>\s?/g, "\n");
		six = six.replace(ohhhh, "\n<blockquote>" + read[1] + "</blockquote>");
	  }
	  else
	  {
		  break;
	  }
  }
  
  six = six.replace(/##\s?([^\n]*)\n/g, "<div style='display:none;'>$1</div>");
  six = six.replace(/\[\[분류:([^\]\]]*)\]\]/g, "");
  
  var include = /\[include\(([^)]*)\)\]/i;
  var under;
  while(true) {
	  if(under = include.exec(six)) {
		  if(req.params.page === under[1]) {
			  six = six.replace(include, "<a href=\"/w/$1\">$1</a>");
		  }
		  else if(fs.existsSync('./data/' + encodeURIComponent(under[1])+'.txt')) {
			var data = fs.readFileSync('./data/' + encodeURIComponent(under[1])+'.txt', 'utf8');
			parseNamu(req, data, function(cnt){
				six = six.replace(include, cnt);
			})
		  }
		  else {
			  six = six.replace(include, "<a class=\"not_thing\" href=\"/w/$1\">$1</a>");
		  }
	  }
	  else {
		  break;
	  }
  }
  
  var tong = /\[\[([^\]\]]*)\|([^\]\]]*)\]\]/;
  var tang = /\[\[([^\]\]]*)\]\]/;
  var match;
  var van;
  var test = /(.*)(#s-[0-9]+)$/;
  var testing;
  six = six.replace(/\[\[(?:(https?:\/\/(?:(?:(?!jpg|png|gif|jpeg))[^\s])*)\.(jpg|png|gif|jpeg))\|([^\]\]]*)\]\]/ig, "<a class#is#\"out_link\" href#is#\"$1#$2#\"><span class#is#\"contect\">外</span>$3</a>");
  six = six.replace(/\[\[(?:(https?:\/\/(?:(?:(?!jpg|png|gif|jpeg))[^\s])*)\.(jpg|png|gif|jpeg))\]\]/ig, "<a class#is#\"out_link\" href#is#\"$1#$2#\"><span class#is#\"contect\">外</span>$1#$2#</a>");
  
  six = six.replace(/\[\[wiki:([^\]\]]*)\|([^\]\]]*)\]\]/ig, "<a class#is#\"out_link\" href#is#\"/$1\">$2</a>");
  six = six.replace(/\[\[wiki:([^\]\]]*)\]\]/ig, "<a class#is#\"out_link\" href#is#\"/$1\">$1</a>");
	
  six = six.replace(/\[\[(https?:\/\/)([^\]\]]*)\|([^\]\]]*)\]\]/ig, "<a class#is#\"out_link\" href#is#\"$1$2\"><span class#is#\"contect\">外</span>$3</a>");
  six = six.replace(/\[\[(https?:\/\/)([^\]\]]*)\]\]/ig, "<a class#is#\"out_link\" href#is#\"$1$2\"><span class#is#\"contect\">外</span>$1$2</a>");
  
  while(true) {
	if(match = tong.exec(six)) {
		van = '';
		if(match[1] === req.params.page) {
			six = six.replace(tong, '<b>'+match[2]+'</b>');
		}
		else if(testing = test.exec(match[1])) {
			if(!fs.existsSync('./data/' + encodeURIComponent(testing[1])+'.txt')) {
				van = van + 'class#is#"not_thing"';
			}
			six = six.replace(tong, '<a '+van+' title#is#"'+htmlencode.htmlEncode(testing[1])+testing[2]+'" href#is#"/w/'+encodeURIComponent(testing[1])+testing[2]+'">'+match[2]+'</a>');
			
			var exists = fs.existsSync('./data/' + encodeURIComponent(testing[1])+'-back/');
			if(!exists) {
				fs.mkdirSync('./data/' + encodeURIComponent(testing[1])+'-back/', 777);
				fs.open('./data/' + encodeURIComponent(testing[1])+'-back/' + encodeURIComponent(req.params.page) + '.txt','w+',function(err,fd){
				});
			}
			else {
				var exists = fs.existsSync('./data/' + encodeURIComponent(testing[1])+'-back/' + encodeURIComponent(req.params.page) + '.txt');
				if(!exists) {
					fs.open('./data/' + encodeURIComponent(testing[1])+'-back/' + encodeURIComponent(req.params.page) + '.txt','w+',function(err,fd){
					});
				}
			}
		}
		else {
			if(!fs.existsSync('./data/' + encodeURIComponent(match[1])+'.txt')) {
				van = van + 'class#is#"not_thing"';
			}
			six = six.replace(tong, '<a '+van+' title#is#"'+htmlencode.htmlEncode(match[1])+'" href#is#"/w/'+encodeURIComponent(match[1])+'">'+match[2]+'</a>');
			
			var exists = fs.existsSync('./data/' + encodeURIComponent(match[1])+'-back/');
			if(!exists) {
				fs.mkdirSync('./data/' + encodeURIComponent(match[1])+'-back/', 777);
				fs.open('./data/' + encodeURIComponent(match[1])+'-back/' + encodeURIComponent(req.params.page) + '.txt','w+',function(err,fd){
				});
			}
			else {
				var exists = fs.existsSync('./data/' + encodeURIComponent(match[1])+'-back/' + encodeURIComponent(req.params.page) + '.txt');
				if(!exists) {
					fs.open('./data/' + encodeURIComponent(match[1])+'-back/' + encodeURIComponent(req.params.page) + '.txt','w+',function(err,fd){
					});
				}
			}
		}
	}
	else {
		break;
	}
  }
  while(true) {
	if(match = tang.exec(six)) {
		van = '';
		if(match[1] === req.params.page) {
			six = six.replace(tang, '<b>'+match[1]+'</b>');
		}
		else if(testing = test.exec(match[1])) {
			if(!fs.existsSync('./data/' + encodeURIComponent(testing[1])+'.txt')) {
				van = van + 'class#is#"not_thing"';
			}
			six = six.replace(tang, '<a '+van+' title#is#"'+htmlencode.htmlEncode(testing[1]+testing[2])+'" href#is#"/w/'+encodeURIComponent(testing[1])+testing[2]+'">'+match[1]+'</a>');
			
			var exists = fs.existsSync('./data/' + encodeURIComponent(testing[1])+'-back/');
			if(!exists) {
				fs.mkdirSync('./data/' + encodeURIComponent(testing[1])+'-back/', 777);
				fs.open('./data/' + encodeURIComponent(testing[1])+'-back/' + encodeURIComponent(req.params.page) + '.txt','w+',function(err,fd){
				});
			}
			else {
				var exists = fs.existsSync('./data/' + encodeURIComponent(testing[1])+'-back/' + encodeURIComponent(req.params.page) + '.txt');
				if(!exists) {
					fs.open('./data/' + encodeURIComponent(testing[1])+'-back/' + encodeURIComponent(req.params.page) + '.txt','w+',function(err,fd){
					});
				}
			}
		}
		else {
			if(!fs.existsSync('./data/' + encodeURIComponent(match[1])+'.txt')) {
				van = van + 'class#is#"not_thing"';
			}
			six = six.replace(tang, '<a '+van+' title#is#"'+htmlencode.htmlEncode(match[1])+'" href#is#"/w/'+encodeURIComponent(match[1])+'">'+match[1]+'</a>');
			
			var exists = fs.existsSync('./data/' + encodeURIComponent(match[1])+'-back/');
			if(!exists) {
				fs.mkdirSync('./data/' + encodeURIComponent(match[1])+'-back/', 777);
				fs.open('./data/' + encodeURIComponent(match[1])+'-back/' + encodeURIComponent(req.params.page) + '.txt','w+',function(err,fd){
				});
			}
			else {
				var exists = fs.existsSync('./data/' + encodeURIComponent(match[1])+'-back/' + encodeURIComponent(req.params.page) + '.txt');
				if(!exists) {
					fs.open('./data/' + encodeURIComponent(match[1])+'-back/' + encodeURIComponent(req.params.page) + '.txt','w+',function(err,fd){
					});
				}
			}
		}
	}
	else {
		break;
	}
  }
  
  var h = /(={1,6})\s?([^=]*)\s?(?:={1,6})(?:\s+)?\r\n/;
  var h0c = 0;
  var h1c = 0;
  var h2c = 0;
  var h3c = 0;
  var h4c = 0;
  var h5c = 0;
  var last = 0;
  var head;
  var toc;
  var wiki;
  var rtoc = '<div id="toc"><span id="toc-name">목차</span><br><br>';
  while(true) {
	  if(head = h.exec(six)) {
		  wiki = head[1].length;
		  if(last < wiki) {
			  last = wiki;
		  }
		  else {
			  last = wiki;
			  if(wiki === 1) {
				h1c = 0;
				h2c = 0;
				h3c = 0;
				h4c = 0;
				h5c = 0;
			  }
			  else if(wiki === 2) {
				h2c = 0;
				h3c = 0;
				h4c = 0;
				h5c = 0;
			  }
			  else if(wiki === 3) {
				h3c = 0;
				h4c = 0;
				h5c = 0;
			  }
			  else if(wiki === 4) {
				h4c = 0;
				h5c = 0;
			  }
			  else if(wiki === 5) {
				h4c = 0;
			  }
		  }
		  if(wiki === 1) {
				h0c = h0c + 1;
		  }
		  else if(wiki === 2) {
		        h1c = h1c + 1;
		  }
		  else if(wiki === 3) {
		        h2c = h2c + 1;
		  }
		  else if(wiki === 4) {
		        h3c = h3c + 1;
		  }
		  else if(wiki === 5) {
		        h4c = h4c + 1;
		  }
		  else {
		        h5c = h5c + 1;
		  }
		  toc = h0c + '.' + h1c + '.' + h2c + '.' + h3c + '.' + h4c + '.' + h5c + '.';
		  toc = toc.replace(/([0-9]0(?:[0]*)?)\./g, '$1#.');
	      toc = toc.replace(/0\./g, '');
		  toc = toc.replace(/#\./g, '.');
	      toc = toc.replace(/\.$/g, '');
		  rtoc = rtoc + '<a href="#s-' + toc + '">' + toc + '</a>. ' + head[2] + '<br>';
		  six = six.replace(h, '<h'+wiki+'><a href="#toc" id="s-' + toc + '">' + toc + '.</a> $2</h'+wiki+'>');
	  } else {
		  rtoc = rtoc + '</div>';
		  break;
	  }
  }

  six = six.replace(/#is#/g, '=');
  rtoc = rtoc.replace(/#is#/g, '=');

  six = six.replace(/\[(?:목차|tableofcontents)\]/ig, rtoc);
  
  six = six.replace(/'''(.+?)'''(?!')/g,'<strong>$1</strong>');
  six = six.replace(/''(.+?)''(?!')/g,'<i>$1</i>');
  six = six.replace(/~~(.+?)~~(?!~)/g,'<s>$1</s>');
  six = six.replace(/--(.+?)--(?!-)/g,'<s>$1</s>');
  six = six.replace(/__(.+?)__(?!_)/g,'<u>$1</u>');
  six = six.replace(/\^\^(.+?)\^\^(?!\^)/g,'<sup>$1</sup>');
  six = six.replace(/,,(.+?),,(?!,)/g,'<sub>$1</sub>');
  
  six = six.replace(/\[br\]/ig,'<br>');
  
  six = six.replace(/(https?:\/\/(?:(?:(?:(?!\.(?:jpg|png|gif|jpeg)))[^\s])*)\.(?:jpg|png|gif|jpeg))(?:\?([^&\n]*))?(?:\&([^&\n]*))?(?:\&([^&\n]*))?/ig, '<img src="$1" $2 $3 $4><hr style="display: inline;">');
  
  six = six.replace(/#jpg#/g, '.$1');
  six = six.replace(/#jpeg#/g, '.$1');
  six = six.replace(/#png#/g, '.$1');
  six = six.replace(/#gif#/g, '.$1');
  
  var youtube = /\[youtube\(([^,\n]*)(?:,([^)\n]*))?\)\]/i;
  var widthy = /width=([0-9]*)/i;
  var heighty = /height=([0-9]*)/i;
  var matchy;
  var matchy2;
  var matchy3;
  
  while(true) {
	  if(matchy = youtube.exec(six)) {
		  var ytw = 0;
		  var yth = 0;
		  if(matchy2 = widthy.exec(matchy)) {
				ytw = 'width='+matchy2[1];
		  }
		  else {
			  ytw = 'width=500';
		  }
		  if(matchy3 = heighty.exec(matchy)) {
				yth = 'height='+matchy3[1];
		  }
		  else {
			  yth = 'height=300';
		  }
		  six = six.replace(youtube, '<iframe '+ytw+' '+yth+' src="https://www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe>');
	  }
	  else {
		  break;
	  }
  }
  
  six = six.replace(/\[(?:date|datetime)\]/ig, today);
  
  six = six.replace(/\[anchor\(([^\[\]]*)\)\]/ig, "<div id=\"$1\"></div>");
  
  var bad = /((?:(?:\s\*\s[^\n]*)\n?)+)/;
  var apple;
  var reimu = /\s\*\s([^\n]*)/g;
  
  while(true) {
	  if(apple = bad.exec(six)) {
		  apple[1] = apple[1].replace(reimu, '<li>$1</li>');
		  apple[1] = apple[1].replace(/\n/g, '');
		  six = six.replace(bad, '<ul id="list">'+apple[1]+'</ul>');
	  }
	  else {
		  break;
	  }
  }
  
  six = six.replace(/-{4,11}/g, "<hr>");
  
  var a = 1;
  var b = /\[\*([^\s]*)\s((?:[^\[\]]+)*)\]/;
  var tou = "<hr id='footnote'><div class='wiki-macro-footnote'><br>";
  
  while(true)
  {
	  match = b.exec(six);
	  if(match === null)
	  {
		  tou = tou + '</div>';
		  if(tou === "<hr id='footnote'><div class='wiki-macro-footnote'><br></div>")
		  {
			  tou = "";
		  }
		  break; 
	  }
	  else if(match[1]) {
		tou = tou + "<span class='footnote-list'><a href=\"#rfn-" + a + "\" id=\"fn-" + a + "\">[" + htmlencode.htmlEncode(match[1]) + "]</a> " + match[2] + "</span><br>";
		six = six.replace(b, "<sup><a href='javascript:void(0);' id=\"rfn-" + a + "\" onclick=\"var f=document.getElementById('footnote_"+a+"');var s=f.style.display=='inline';f.style.display=s?'none':'inline';this.className=s?'':'opened';\">[" + htmlencode.htmlEncode(match[1]) + "]</a></sup><span class='foot' id='footnote_"+a+"' style='display:none;'><a href=\"#fn-" + a + "\" onclick=\"var f=document.getElementById('footnote_"+a+"');var s=f.style.display=='inline';f.style.display=s?'none':'inline';this.className=s?'':'opened';\">[" + htmlencode.htmlEncode(match[1]) + "]</a> <a href='javascript:void(0);' onclick=\"var f=document.getElementById('footnote_"+a+"');var s=f.style.display=='inline';f.style.display=s?'none':'inline';this.className=s?'':'opened';\">[X]</a> " + match[2] + "</span>");
		a = a + 1;
	  }
	  else
	  {
		tou = tou + "<span class='footnote-list'><a href=\"#rfn-" + a + "\" id=\"fn-" + a + "\">[" + a + "]</a> " + match[2] + "</span><br>";
		six = six.replace(b, "<sup><a href='javascript:void(0);' id=\"rfn-" + a + "\" onclick=\"var f=document.getElementById('footnote_"+a+"');var s=f.style.display=='inline';f.style.display=s?'none':'inline';this.className=s?'':'opened';\">[" + a + "]</a></sup><span class='foot' id='footnote_"+a+"' style='display:none;'><a href=\"#fn-" + a + "\" onclick=\"var f=document.getElementById('footnote_"+a+"');var s=f.style.display=='inline';f.style.display=s?'none':'inline';this.className=s?'':'opened';\">[" + a + "]</a> <a href='javascript:void(0);' onclick=\"var f=document.getElementById('footnote_"+a+"');var s=f.style.display=='inline';f.style.display=s?'none':'inline';this.className=s?'':'opened';\">[X]</a> " + match[2] + "</span>");
		a = a + 1;
	  }
  }
 
  var math = /<math>(((?!<math>).)*)<\/math>/i;
  var mathm;
  var matht;
  while(true)
  {
	  if(mathm = math.exec(six)) {	  
		  mathm[1] = '$' + mathm[1] + '$'
		  var matht = katex.renderLaTeX(mathm[1]);
		  six = six.replace(math, matht)
	  }
	  else {
		  break;
	  }
  }
  
  var sp = /\r\n( +)/;
  var np;
  while(true) {
	  if(np = sp.exec(six)) {
		  var tp = np[1].length;
		  var up = '';
		  var i = 0;
		  
		  while(true) {
			  up = up + '<span id="in"></span>';
			  i = i + 1;
			  
			  if(i === tp) {
				  break;
			  }
		  }
		  
		  six = six.replace(sp, '<br>' + up);
	  }
	  else {
		  break;
	  }
  }
  
  six = six.replace(/\n/g, "<br>");
  
  six = six.replace(/\[(?:각주|footnote)\](((<br>+)*(\s+)*(\r\n+)*(\n+))+)?$/ig, "");
  six = six.replace(/\[(?:각주|footnote)\]/ig, "<br>" + tou);
  six = six + tou;
  d('1: '+six)
  
  six = six.replace(/\[(span(\s[^\]]+)?)\]/ig, '<$1>');
  six = six.replace(/\[(font(\s[^\]]+)?)\]/ig, '<$1>');
  six = six.replace(/\[(iframe(\s[^\]]+)?)\]/ig, '<$1>');
  six = six.replace(/\[(big)\]/ig, '<$1>');
  six = six.replace(/\[(small)\]/ig, '<$1>');
  six = six.replace(/\[(del)\]/ig, '<$1>');
  six = six.replace(/\[(s)\]/ig, '<$1>');
  
  six = six.replace(/\[(\/span)\]/ig, '<$1>');
  six = six.replace(/\[(\/font)\]/ig, '<$1>');
  six = six.replace(/\[(\/iframe)\]/ig, '<$1>');
  six = six.replace(/\[(\/big)\]/ig, '<$1>');
  six = six.replace(/\[(\/small)\]/ig, '<$1>');
  six = six.replace(/\[(\/del)\]/ig, '<$1>');
  six = six.replace(/\[(\/s)\]/ig, '<$1>');
  
  //  six = plugin(six);
  ba(six)
  
  // Thank for 2DU, LiteHell //
}
function doNothing(a) {}
