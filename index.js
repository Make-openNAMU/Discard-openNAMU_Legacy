var express = require('express');
var router = express.Router();

var parseNamu = require('./module-internal/namumark');
var mysql = require('mysql2');
var fs = require('fs');
var jsonfile = require('jsonfile');

var set = jsonfile.readFileSync('./set/set.json');

var connection = mysql.createConnection(
{
	host: set.host,
	user: set.user,
	password : set.pw,
	database: set.db
});

function getNow() 
{
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; 
    var yyyy = today.getFullYear();
    var nn = today.getHours();
    var aa = today.getMinutes();
    var ee = today.getSeconds();
	
    if(dd<10) 
	{
  	    dd='0'+dd;
    }
    if(mm<10) 
	{
	    mm='0'+mm;
    }
    if(aa<10) 
	{
	    aa='0'+aa;
    }
    if(ee<10) 
	{
	    ee='0'+ee;
    }
	if(nn<10) 
	{
	    nn='0'+nn;
	}
	
    var now = yyyy + '-' + mm + '-' + dd + '-' + nn + '-' + aa + '-' + ee;
	now = now.replace(/-/g, '');
	
    return now;
}

function getIp(req, res) 
{
	var test = (req.headers['x-forwarded-for'] || '').split(',')[0] 
        || req.connection.remoteAddress;

	return test;
}

connection.connect(function(err) {
	if(err) 
	{
        console.error('디비 에러');
        console.error(err);
        throw err;
    }
	else 
	{
		console.log('문제 없음');
	}
});

router.get('/set', function(req, res) 
{
	connection.query("create table data(title text not null, data text not null)", function(err) 
	{
		if(err) 
		{
			console.error('디비 에러');
			console.error(err);
			throw err;
		}

		connection.query("create table rc(title text not null, date text not null, ip text not null, send text not null, leng text not null)", function(err) 
		{
			if(err) 
			{
				console.error('디비 에러');
				console.error(err);
				throw err;
			}
			
			connection.query("create table history(id text not null, title text not null, data text not null, date text not null, ip text not null, send text not null, leng text not null)", function(err) 
			{
				if(err) 
				{
					console.error('디비 에러');
					console.error(err);
					throw err;
				}
				
				res.render('ban', 
				{ 
					title: '완료',
					content: '이상 없었음',
					name: set.name
				});
				res.end();
				return;
			});
		});
	});
});
	
router.get('/w/:page', function(req, res) 
{	
	connection.query("select * from data where title = '" + encodeURIComponent(req.params.page) + "'", function(err, rows)
	{
		if(err) 
		{
			console.error('디비 에러');
			console.error(err);
			throw err;
		}
		else if(rows[0])
		{
			parseNamu(req, decodeURIComponent(rows[0].data), function(cnt)
			{
				var toc = /<div id="toc">((?:(?!\/div>).)*)<\/div>/;
				var left;
				if(left = toc.exec(cnt)) {
					var tocset = 'block';
				}
				else {
					left = ['',''];
				}
				
				res.render('index',
				{
					title: req.params.page,
					title2: encodeURIComponent(req.params.page),
					content: cnt,
					name: set.name,
					left: left[1],
					license: set.license,
					tocset: tocset
				});
				res.end();
				return;
			});
		}
		else 
		{
			res.render('index',
			{
				title: req.params.page,
				title2: encodeURIComponent(req.params.page),
				content: '<br>문서 없음',
				license: set.license,
				name: set.name
			});
			res.end();
			return;
		}
	});
});

router.get('/r/:page', function(req, res) 
{	
	connection.query("select * from data where title = '" + encodeURIComponent(req.params.page) + "'", function(err, rows)
	{
		if(err) 
		{
			console.error('디비 에러');
			console.error(err);
			throw err;
		}
		else if(rows[0])
		{
			var data = decodeURIComponent(rows[0].data);
			data = data.replace(/\n/g, '<br>');
			
			res.render('raw',
			{
				title: req.params.page,
				title2: encodeURIComponent(req.params.page),
				content: data,
				name: set.name
			});
		}
		else 
		{
			res.redirect('/w/' + encodeURIComponent(req.params.page));
		}
	});
});

router.get('/e/:page', function(req, res) 
{
	connection.query("select * from data where title = '" + encodeURIComponent(req.params.page) + "'", function(err, rows)
	{		
		if(err) 
		{
			console.error('디비 에러');
			console.error(err);
			throw err;
		}
		else if(rows[0])
		{
			res.render('edit',
			{
				title: req.params.page,
				title2: encodeURIComponent(req.params.page),
				content: decodeURIComponent(rows[0].data),
				name: set.name
			});
			res.end();
			return;
		}
		else 
		{
			res.render('edit',
			{
				title: req.params.page,
				title2: encodeURIComponent(req.params.page),
				content: '',
				name: set.name
			});
			res.end();
			return;
		}
	});
});

router.post('/e/:page', function(req, res) 
{	
	connection.query("select * from data where title = '" + encodeURIComponent(req.params.page) + "'", function(err, rows)
	{		
		var today = getNow();
		var ip = getIp(req, res);
		if(err) 
		{
			console.error('디비 에러');
			console.error(err);
			throw err;
		}
		else if(rows[0])
		{
			if(decodeURIComponent(rows[0].data).length > req.body.content.length) {
				var leng = decodeURIComponent(rows[0].data).length - req.body.content.length;
				leng = '-' + leng;
			}
			else if(decodeURIComponent(rows[0].data).length < req.body.content.length) {
				var leng = req.body.content.length - decodeURIComponent(rows[0].data).length;
				leng = '+' + leng;
			}
			else {
				leng = '0';
			}

			connection.query("update data set data = '" + encodeURIComponent(req.body.content) + "' where title = '" + encodeURIComponent(req.params.page) + "'", function(err)
			{
				if(err) 
				{
					console.error('디비 에러');
					console.error(err);
					throw err;
				}
				connection.query("insert into rc (title, date, ip, send, leng) value ('" + encodeURIComponent(req.params.page) + "', '" + today + "', '" + encodeURIComponent(ip) + "', '" + encodeURIComponent(req.body.send) + "', '" + leng + "')", function(err)
				{
					if(err) 
					{
						console.error('디비 에러');
						console.error(err);
						throw err;
					}
					
					connection.query("select * from history where title = '" + encodeURIComponent(req.params.page) + "' order by id+0 desc", function(err, rows)
					{
						if(err) 
						{
							console.error('디비 에러');
							console.error(err);
							throw err;
						}
						
						if(rows[0]) 
						{
							var number = Number(rows[0].id) + 1;
							console.log(rows[0].id);
							console.log(number);

							connection.query("insert into history (id, title, data, date, ip, send, leng) value ('" + number + "', '" + encodeURIComponent(req.params.page) + "', '" + encodeURIComponent(req.body.content) + "', '" + today + "', '" + encodeURIComponent(ip) + "', '" + encodeURIComponent(req.body.send) + "', '" + leng + "')", function(err)
							{
								if(err) 
								{
									console.error('디비 에러');
									console.error(err);
									throw err;
								}
							});	
						}
						else
						{
							connection.query("insert into history (id, title, data, date, ip, send, leng) value ('1', '" + encodeURIComponent(req.params.page) + "', '" + encodeURIComponent(req.body.content) + "', '" + today + "', '" + encodeURIComponent(ip) + "', '" + encodeURIComponent(req.body.send) + "', '" + leng + "')", function(err)
							{
								if(err) 
								{
									console.error('디비 에러');
									console.error(err);
									throw err;
								}
							});	
						}
					});
				});
			});
		}
		else 
		{
			var leng = req.body.content.length;
			leng = '+' + leng;
			
			connection.query("insert into data (title, data) value ('" + encodeURIComponent(req.params.page) + "', '" + encodeURIComponent(req.body.content) + "')", function(err)
			{
				if(err) 
				{
					console.error('디비 에러');
					console.error(err);
					throw err;
				}
				
				connection.query("insert into rc (title, date, ip, send, leng) value ('" + encodeURIComponent(req.params.page) + "', '" + today + "', '" + encodeURIComponent(ip) + "', '" + encodeURIComponent(req.body.send) + "', '" + leng + "')", function(err)
				{
					if(err) 
					{
						console.error('디비 에러');
						console.error(err);
						throw err;
					}
					
					connection.query("select * from history where title = '" + encodeURIComponent(req.params.page) + "' order by id+0 desc", function(err, rows)
					{
						if(err) 
						{
							console.error('디비 에러');
							console.error(err);
							throw err;
						}
						
						if(rows[0]) 
						{
							var number = Number(rows[0].id) + 1;
							
							connection.query("insert into history (id, title, data, date, ip, send, leng) value ('" + number + "', '" + encodeURIComponent(req.params.page) + "', '" + encodeURIComponent(req.body.content) + "', '" + today + "', '" + encodeURIComponent(ip) + "', '" + encodeURIComponent(req.body.send) + "', '" + leng + "')", function(err)
							{
								if(err) 
								{
									console.error('디비 에러');
									console.error(err);
									throw err;
								}
							});	
						}
						else
						{
							connection.query("insert into history (id, title, data, date, ip, send, leng) value ('1', '" + encodeURIComponent(req.params.page) + "', '" + encodeURIComponent(req.body.content) + "', '" + today + "', '" + encodeURIComponent(ip) + "', '" + encodeURIComponent(req.body.send) + "', '" + leng + "')", function(err)
							{
								if(err) 
								{
									console.error('디비 에러');
									console.error(err);
									throw err;
								}
							});	
						}
					});
				});
			});
		}
		res.redirect('/w/' + encodeURIComponent(req.params.page));
	});
});

router.get('/d/:page', function(req, res) 
{
	connection.query("select * from data where title = '" + encodeURIComponent(req.params.page) + "'", function(err, rows)
	{		
		if(err) 
		{
			console.error('디비 에러');
			console.error(err);
			throw err;
		}
		else if(rows[0])
		{
			res.render('delete',
			{
				title: req.params.page,
				title2: encodeURIComponent(req.params.page),
				name: set.name
			});
			res.end();
			return;
		}
		else 
		{
			res.redirect('/w/' + encodeURIComponent(req.params.page));
		}
	});
});

router.post('/d/:page', function(req, res) 
{	
	connection.query("select * from data where title = '" + encodeURIComponent(req.params.page) + "'", function(err, rows)
	{		
		var today = getNow();
		var ip = getIp(req, res);
		if(err) 
		{
			console.error('디비 에러');
			console.error(err);
			throw err;
		}
		else if(rows[0])
		{
			var leng = decodeURIComponent(rows[0].data).length;
			leng = '-' + leng;
			
			req.body.send = '<a href="/w/' + encodeURIComponent(req.params.page) + '">' + req.params.page + '</a> 문서를 삭제 했습니다.';

			connection.query("delete from data where title = '" + encodeURIComponent(req.params.page) + "'", function(err)
			{
				if(err) 
				{
					console.error('디비 에러');
					console.error(err);
					throw err;
				}
				connection.query("insert into rc (title, date, ip, send, leng) value ('" + encodeURIComponent(req.params.page) + "', '" + today + "', '" + encodeURIComponent(ip) + "', '" + encodeURIComponent(req.body.send) + "', '" + leng + "')", function(err)
				{
					if(err) 
					{
						console.error('디비 에러');
						console.error(err);
						throw err;
					}
					
					connection.query("select * from history where title = '" + encodeURIComponent(req.params.page) + "' order by id+0 desc", function(err, rows)
					{
						if(err) 
						{
							console.error('디비 에러');
							console.error(err);
							throw err;
						}
						
						if(rows[0]) 
						{
							var number = Number(rows[0].id) + 1;

							connection.query("insert into history (id, title, data, date, ip, send, leng) value ('" + number + "', '" + encodeURIComponent(req.params.page) + "', '', '" + today + "', '" + encodeURIComponent(ip) + "', '" + encodeURIComponent(req.body.send) + "', '" + leng + "')", function(err)
							{
								if(err) 
								{
									console.error('디비 에러');
									console.error(err);
									throw err;
								}
							});	
						}
					});
				});
			});
		}
		
		res.redirect('/w/' + encodeURIComponent(req.params.page));
	});
});

router.get('/m/:page', function(req, res) 
{
	connection.query("select * from data where title = '" + encodeURIComponent(req.params.page) + "'", function(err, rows)
	{		
		if(err) 
		{
			console.error('디비 에러');
			console.error(err);
			throw err;
		}
		else if(rows[0])
		{
			res.render('move',
			{
				title: req.params.page,
				title2: encodeURIComponent(req.params.page),
				name: set.name
			});
			res.end();
			return;
		}
		else 
		{
			res.redirect('/w/' + encodeURIComponent(req.params.page));
		}
	});
});

router.post('/m/:page', function(req, res) 
{
	if(encodeURIComponent(req.params.page) === encodeURIComponent(req.body.title))
	{
		res.redirect('/doex');
	}
	else {
		connection.query("select * from history where title = '" + encodeURIComponent(req.body.title) + "'", function(err, rows)
		{
			if(rows[0])
			{
				res.redirect('/doex');
			}
			else 
			{
				connection.query("select * from data where title = '" + encodeURIComponent(req.params.page) + "'", function(err, rows)
				{		
					var today = getNow();
					var ip = getIp(req, res);
					if(err) 
					{
						console.error('디비 에러');
						console.error(err);
						throw err;
					}
					else if(rows[0])
					{
						var leng = '0';
						
						req.body.send = '<a href="/w/' + encodeURIComponent(req.params.page) + '">' + req.params.page + '</a> 문서를 <a href="/w/' + encodeURIComponent(req.body.title) + '">' + req.body.title + '</a> 문서로 이동 했습니다.';

						connection.query("update data set title = '" + encodeURIComponent(req.body.title) + "' where title = '" + encodeURIComponent(req.params.page) + "'", function(err)
						{
							if(err) 
							{
								console.error('디비 에러');
								console.error(err);
								throw err;
							}
							connection.query("insert into rc (title, date, ip, send, leng) value ('" + encodeURIComponent(req.params.page) + "', '" + today + "', '" + encodeURIComponent(ip) + "', '" + encodeURIComponent(req.body.send) + "', '" + leng + "')", function(err)
							{
								if(err) 
								{
									console.error('디비 에러');
									console.error(err);
									throw err;
								}
								
								connection.query("select * from history where title = '" + encodeURIComponent(req.params.page) + "' order by id+0 desc", function(err, rows)
								{
									if(err) 
									{
										console.error('디비 에러');
										console.error(err);
										throw err;
									}
									
									if(rows[0]) 
									{
										var number = Number(rows[0].id) + 1;

										connection.query("insert into history (id, title, data, date, ip, send, leng) value ('" + number + "', '" + encodeURIComponent(req.params.page) + "', '', '" + today + "', '" + encodeURIComponent(ip) + "', '" + encodeURIComponent(req.body.send) + "', '" + leng + "')", function(err)
										{
											if(err) 
											{
												console.error('디비 에러');
												console.error(err);
												throw err;
											}
											
											connection.query("update history set title = '" + encodeURIComponent(req.body.title) + "' where title = '" + encodeURIComponent(req.params.page) + "'", function(err)
											{
												if(err) 
												{
													console.error('디비 에러');
													console.error(err);
													throw err;
												}
											});
										});	
									}
								});
							});
						});
					}
					
					res.redirect('/w/' + encodeURIComponent(req.body.title));
				});
			}
		});
	}
});

router.get('/rc', function(req, res) 
{
	connection.query("select * from rc order by date desc limit 50", function(err, rows)
	{
		if(err) 
		{
			console.error('디비 에러');
			console.error(err);
			throw err;
		}
		else if(rows[0]) {
			var i = 0;
			var div = '<div>';
			
			while(true) 
			{
				if(rows[i])
				{
					if(!rows[i].send) 
					{
						var send = '<br>';
					}
					else {
						var send = decodeURIComponent(rows[i].send);
					}
					
					var now = /^([0-9][0-9][0-9][0-9])([0-9][0-9])([0-9][0-9])([0-9][0-9])([0-9][0-9])([0-9][0-9])$/;
					var date = rows[i].date.replace(now, '$1-$2-$3 $4:$5:$6');
					
					var plus = /\+/;
					var minus = /\-/;
					
					if(plus.exec(rows[i].leng))
					{
						var leng = '<span style="color:green;">(' + rows[i].leng + ')</span>';
					}
					else if(minus.exec(rows[i].leng))
					{
						var leng = '<span style="color:red;">(' + rows[i].leng + ')</span>';
					}
					else 
					{
						var leng = '<span style="color:gray;">(' + rows[i].leng + ')</span>';
					}
					
					
					div = div + '<table id="toron"><tbody><tr><td id="yosolo"><a href="/w/' + rows[i].title + '">' + decodeURIComponent(rows[i].title) + '</a> ' + leng + ' <a href="/h/' + rows[i].title + '">(역사)</a></td><td id="yosolo">' + decodeURIComponent(rows[i].ip) + '</td><td id="yosolo">' + date + '</td></tr><tr><td colspan="3" id="yosolo">' + send + '</td></tr></tbody></table>';
					
					
				}
				else {
					div = div + '</div>';
					break;
				}
				
				if(i == 50) 
				{
					div = div + '</div>';
					break;
				}
				
				i = i + 1;
			}
		}
		else 
		{
			div = div + '</div>';
		}
		
		res.render('rc',
		{
			title: '최근바뀜',
			content: div,
			name: set.name
		});
		res.end();
		return;
	});
});

router.get('/h/:page', function(req, res) 
{
	connection.query("select * from history where title = '" + encodeURIComponent(req.params.page) + "' order by id+0 desc", function(err, rows)
	{
		if(rows[0])
		{
			var i = 0;
			var div = '<div>';
			
			while(true) 
			{
				if(rows[i])
				{
					if(!rows[i].send) 
					{
						var send = '<br>';
					}
					else {
						var send = decodeURIComponent(rows[i].send);
					}
					
					var now = /^([0-9][0-9][0-9][0-9])([0-9][0-9])([0-9][0-9])([0-9][0-9])([0-9][0-9])([0-9][0-9])$/;
					var date = rows[i].date.replace(now, '$1-$2-$3 $4:$5:$6');
					
					var plus = /\+/;
					var minus = /\-/;
					
					if(plus.exec(rows[i].leng))
					{
						var leng = '<span style="color:green;">(' + rows[i].leng + ')</span>';
					}
					else if(minus.exec(rows[i].leng))
					{
						var leng = '<span style="color:red;">(' + rows[i].leng + ')</span>';
					}
					else 
					{
						var leng = '<span style="color:gray;">(' + rows[i].leng + ')</span>';
					}
					
					
					div = div + '<table id="toron"><tbody><tr><td id="yosolo">R' + rows[i].id + ' ' + leng + ' <a href="/h/' + rows[i].id + '/w/' + encodeURIComponent(req.params.page) + '">(w)</a> <a href="/h/' + rows[i].id + '/r/' + encodeURIComponent(req.params.page) + '">(Raw)</a> <a href="/h/' + rows[i].id + '/rv/' + encodeURIComponent(req.params.page) + '">(되돌리기)</a></td><td id="yosolo">' + decodeURIComponent(rows[i].ip) + '</td><td id="yosolo">' + date + '</td></tr><tr><td colspan="3" id="yosolo">' + send + '</td></tr></tbody></table>';
					
					
				}
				else 
				{
					div = div + '</div>';
					break;
				}
				
				i = i + 1;
			}
			
			res.render('history',
			{
				title: req.params.page,
				title2: encodeURIComponent(req.params.page),
				content: div,
				name: set.name
			});
			res.end();
			return;
		}
		else
		{
			res.redirect('/w/' + encodeURIComponent(req.params.page));
		}
	});
});

router.get('/h/:id/w/:page', function(req, res) 
{
	connection.query("select * from history where title = '" + encodeURIComponent(req.params.page) + "' and id = '" + req.params.id + "' order by id+0 desc", function(err, rows)
	{
		if(err) 
		{
			console.error('디비 에러');
			console.error(err);
			throw err;
		}
		else if(rows[0])
		{
			parseNamu(req, decodeURIComponent(rows[0].data), function(cnt)
			{
				var toc = /<div id="toc">((?:(?!\/div>).)*)<\/div>/;
				var left;
				if(left = toc.exec(cnt)) {
					var tocset = 'block';
				}
				else {
					left = ['',''];
				}
				
				res.render('h-index',
				{
					title: req.params.page,
					title2: encodeURIComponent(req.params.page),
					id: req.params.id,
					content: cnt,
					name: set.name,
					left: left[1],
					tocset: tocset
				});
				res.end();
				return;
			});
		}
		else 
		{
			res.redirect('/h/' + encodeURIComponent(req.params.page));
		}	
	});
});

router.get('/h/:id/r/:page', function(req, res) 
{
	connection.query("select * from history where title = '" + encodeURIComponent(req.params.page) + "' and id = '" + req.params.id + "' order by id+0 desc", function(err, rows)
	{
		if(err) 
		{
			console.error('디비 에러');
			console.error(err);
			throw err;
		}
		else if(rows[0])
		{
			var data = decodeURIComponent(rows[0].data);
			data = data.replace(/\n/g, '<br>');
			
			res.render('h-index',
			{
				title: req.params.page,
				title2: encodeURIComponent(req.params.page),
				id: req.params.id + ' Raw',
				content: '<br>' + data,
				name: set.name
			});
			res.end();
			return;
		}
		else 
		{
			res.redirect('/h/' + encodeURIComponent(req.params.page));
		}	
	});
});

router.get('/h/:id/rv/:page', function(req, res) 
{
	connection.query("select * from data where title = '" + encodeURIComponent(req.params.page) + "'", function(err, rows)
	{		
		if(err) 
		{
			console.error('디비 에러');
			console.error(err);
			throw err;
		}
		else if(rows[0])
		{
			connection.query("select * from history where title = '" + encodeURIComponent(req.params.page) + "' and id = '" + req.params.id + "'", function(err, rows)
			{
				if(err) 
				{
					console.error('디비 에러');
					console.error(err);
					throw err;
				}
				else if(rows[0])
				{
					res.render('revert',
					{
						title: req.params.page,
						title2: encodeURIComponent(req.params.page),
						title3: req.params.id,
						name: set.name
					});
					res.end();
					return;
				}
				else 
				{
					res.redirect('/h/' + encodeURIComponent(req.params.page));
				}
			});
		}
		else 
		{
			res.redirect('/w/' + encodeURIComponent(req.params.page));
		}
	});
});

router.post('/h/:id/rv/:page', function(req, res) 
{
	connection.query("select * from data where title = '" + encodeURIComponent(req.params.page) + "'", function(err, rows)
	{		
		var today = getNow();
		var ip = getIp(req, res);
		
		if(err)
		{
			console.error('디비 에러');
			console.error(err);
			throw err;
		}
		else if(rows[0])
		{
			var data = rows[0].data;
			
			connection.query("select * from history where title = '" + encodeURIComponent(req.params.page) + "' and id = '" + req.params.id + "'", function(err, rows)
			{
				if(err)
				{
					console.error('디비 에러');
					console.error(err);
					throw err;
				}
				else if(rows[0])
				{
					if(decodeURIComponent(data).length > decodeURIComponent(rows[0].data).length) {
						var leng = decodeURIComponent(data).length - decodeURIComponent(rows[0].data).length;
						leng = '-' + leng;
					}
					else if(decodeURIComponent(data).length < decodeURIComponent(rows[0].data).length) {
						var leng = decodeURIComponent(rows[0].data).length - decodeURIComponent(data).length;
						leng = '+' + leng;
					}
					else {
						leng = '0';
					}
					
					var data = rows[0].data;
					
					req.body.send = req.params.id + '판으로 되돌렸습니다.';

					connection.query("update data set data = '" + rows[0].data + "' where title = '" + encodeURIComponent(req.params.page) + "'", function(err)
					{
						if(err) 
						{
							console.error('디비 에러');
							console.error(err);
							throw err;
						}
						connection.query("insert into rc (title, date, ip, send, leng) value ('" + encodeURIComponent(req.params.page) + "', '" + today + "', '" + encodeURIComponent(ip) + "', '" + encodeURIComponent(req.body.send) + "', '" + leng + "')", function(err)
						{
							if(err) 
							{
								console.error('디비 에러');
								console.error(err);
								throw err;
							}
							
							connection.query("select * from history where title = '" + encodeURIComponent(req.params.page) + "' order by id+0 desc", function(err, rows)
							{
								if(err) 
								{
									console.error('디비 에러');
									console.error(err);
									throw err;
								}
								
								if(rows[0]) 
								{
									var number = Number(rows[0].id) + 1;

									connection.query("insert into history (id, title, data, date, ip, send, leng) value ('" + number + "', '" + encodeURIComponent(req.params.page) + "', '" + data + "', '" + today + "', '" + encodeURIComponent(ip) + "', '" + encodeURIComponent(req.body.send) + "', '" + leng + "')", function(err)
									{
										if(err) 
										{
											console.error('디비 에러');
											console.error(err);
											throw err;
										}
									});	
								}
							});
						});
					});
				}
				else 
				{
					res.redirect('/h/' + encodeURIComponent(req.params.page));
				}
			});
		}
		
		res.redirect('/w/' + encodeURIComponent(req.params.page));
	});
});

router.get('/w/', function(req, res) 
{
	res.redirect('/w/' + set.frontpage);
});

router.get('/', function(req, res) 
{
	res.redirect('/w/' + set.frontpage);
});

router.get('/other', function(req, res) 
{
	res.render('ban', 
	{ 
		title: '기타 메뉴',
		content: '<li><a href="/art">모든 문서</a><li><a href="/gram">문법 설명</a></li>', 
		name: set.name 
	});
	res.end();
	return;
});

router.get('/art', function(req, res) 
{
	connection.query("select * from data", function(err, rows)
	{
		var i = 0;
		var div = '<div>';
		if(rows[0]) 
		{
			while(true)
			{
				if(rows[i])
				{
					div = div + '<li><a href="/w/' + rows[i].title + '">' + decodeURIComponent(rows[i].title) + '</a></li>';
				}
				else 
				{
					div = div + '</div>';
					break;
				}
				
				i = i + 1;
			}
			res.render('ban', 
			{ 
				title: '모든 문서',
				content: div, 
				name: set.name 
			});
			res.end();
			return;
		}
		else 
		{
			res.redirect('/');
		}
	});
});

router.get('/gram', function(req, res) 
{
	var data = fs.readFileSync('./namumark.txt', 'utf8');
	
	res.render('ban', 
	{ 
		title: '문법 설명', 
		content: data, 
		name: set.name
	});
	res.end();
	return;
});

router.get('/doex', function(req, res) {
	res.render('ban', { 
		title: '문서 이동 오류', 
		content: '동일한 제목의 문서가 있습니다.', 
		name: set.name  
	});
	res.end();
	return;
});

router.get('/random', function(req, res) {
	connection.query("select * from data order by rand() limit 1", function(err, rows)
	{		
		if(err)
		{
			console.error('디비 에러');
			console.error(err);
			throw err;
		}
		else if(rows[0])
		{
			res.redirect('/w/' + rows[0].title);
		}
	});
});

router.post('/search', function(req, res) {
	res.redirect('/w/' + encodeURIComponent(req.body.name));
});

module.exports = router;