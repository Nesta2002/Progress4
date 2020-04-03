//mempersiapkan dependensi yang dibutuhkan
const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const session = require('express-session')
const jwt = require('jsonwebtoken')

//membuat aplikasi menggunakan framework express
const app = express()

//menggunakan aplikasi session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

//inisialisasi port
const port = 7000;

//inisialisasi secretKey
const secretKey = 'thisisverysecretkey'

//menggunakan bodyParser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

//mengkoneksikan ke database
const db = mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: "jual_masker"
})

//inisialisasi token yang akan digunakan
const isAuthorized = (request, result, next) => {
    // cek apakah user sudah mengirim header 'x-api-key'
    if (typeof(request.headers['x-api-key']) == 'undefined') {
        return result.status(403).json({
            success: false,
            message: 'Unauthorized. Token is not provided!'
        })
    }

    // get token dari header
    let token = request.headers['x-api-key']

    // melakukan verifikasi token yang dikirim user
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return result.status(401).json({
                success: false,
                message: 'Unauthorized. Token is invalid'
            })
        }
    })

    // lanjut ke next request
    next()
}

//mencocokkan username dan password yang ada di database
app.post('/login/penjual', function(request, response) {
    let data = request.body
	let username = data.username;
	let password = data.password;
	if (username && password) {
		db.query('select * from penjual where username= ? and password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = data.username;
				response.redirect('/login/penjual');
			} else {
				response.send('Username Password invalid!');
			}			
			response.end();
		});
	} else {
		response.send('Enter Username and Password!');
		response.end();
	}
});


app.get('/login/penjual', function(request, results) {
	if (request.session.loggedin) {
        let data = request.body
        let token = jwt.sign(data.username + '|' + data.password, secretKey)

        results.json({
            success: true,
            message: 'Login success, welcome back!',
            token: token
        })
	} else {
        results.json({
            success: false,
            message:'Please enter Username and Password!'
        })
        }
	
	results.end();
});

//mencocokkan email dan password yang ada di database
app.post('/login/pembeli', function(request, response) {
	let email = request.body.email;
	let password = request.body.password;
	if (email && password) {
		db.query('select * from pembeli where email = ? and password = ?', [email, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.email = email;
				response.redirect('/home');
			} else {
				response.send('Email Password invalid!');
			}			
			response.end();
		});
	} else {
		response.send('Enter Email and Password!');
		response.end();
	}
});


app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.send('Welcome, ' + request.session.email + '!');
	} else {
		response.send('Please enter Email and Password!');
	}
	response.end();
});

/***** CRUD Pembeli ******/
//get pembeli
app.get('/pembeli', isAuthorized, (req, res) => {
    let sql = `
        select nama, kontak, email, password from pembeli
    `
    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Success get all data!",
            data: result
        })
    })
})

//post pembeli
app.post('/register/pembeli', (req, res) => {
    let data = req.body
    let sql = `insert into pembeli (nama, kontak, email, password)
    values ('`+data.nama+`', '`+data.kontak+`', '`+data.email+`', '`+data.password+`')
`
db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
        message: "Success add data!",
        data: result
    })
})
})

//get pembeli berdasarkan id
app.get('/pembeli/:id_pembeli', isAuthorized,(req, res) => {
let sql = `
    select * from pembeli
    where id_pembeli = `+req.params.id_pembeli+`
    limit 1
`
db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
        message: "Succes get data detail!",
        data: result[0]
    })
})
})

//put pembeli berdasarkan id
app.put('/pembeli/:id_pembeli', isAuthorized,(req, res) => {
let data = req.body

let sql = `
    update pembeli
    set nama = '`+data.nama+`', kontak = '`+data.kontak+`', email = '`+data.email+`', password = '`+data.password+`'
    where id_pembeli = '`+req.params.id_pembeli+`'
`
db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
        message: "Success update data!",
        data: result
    })
})
})

//delete pembeli berdasarkan id
app.delete('/pembeli/:id_pembeli', isAuthorized,(req, res) => {
let sql = `
    delete from pembeli
    where id_pembeli = '`+req.params.id_pembeli+`'
`
db.query(sql, (err, result) => {
    if (err) throw err
    
    res.json({
        message: "Success delete data",
        data: result
    })
})
})

/***** CRUD Masker ******/
//get masker
app.get('/masker', (req, res) => {
    let sql = `
        select warna, stock from masker
    `
    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Success get all data!",
            data: result
        })
    })
})

//add masker
app.post('/masker',isAuthorized, (req, res) => {
    let data = req.body
    let sql = `insert into masker (warna, stock, harga)
    values ('`+data.warna+`', '`+data.stock+`', '`+data.harga+`')
`
    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Success add data!",
            data: result
        })
    })
})

//get masker berdasarkan id
app.get('/masker/:id_masker', isAuthorized, (req, res) => {
    let sql = `
        select * from masker
        where id_masker = `+req.params.id_masker+`
        limit 1
    `
    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Success get data detail",
            data: result[0]
        })
    })
})

//put masker berdasarkan id
app.put('/masker/:id_masker', isAuthorized, (req, res) => {
    let data = req.body
    let sql = `
        update masker
        set warna = '`+data.warna+`', stock = '`+data.stock+`', , harga = '`+data.harga+`'
        where id_masker = '`+req.params.id_masker+`'
    `
    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Success update data!",
            data: result
        })
    })
})

//delete masker berdasarkn id
app.delete('/masker/:id_masker', isAuthorized,(req, res) => {
    let sql = `
        delete from masker
        where id_masker = '`+req.params.id_masker+`'
    `
    db.query(sql, (err, result) => {
        if (err) throw err
        
        res.json({
            message: "Success delete data!",
            data: result
        })
    })
})

/***** CRUD Transaksi ******/
//add transaksi
app.post('/masker/:id/buy', (req, res) => {
    let data = req.body

    db.query(`
        insert into transaksi (id_masker, id_pembeli, jumlah, total)
        values ('`+req.body.id_masker+`', '`+req.body.id_pembeli+`', '`+req.body.jumlah+`', '`+req.body.total+`')
    `, (err, result) => {
        if (err) throw err 
    })

    db.query(`
        update masker
        set stock = stock - 1
        where id_masker = '`+req.body.id_masker+`'  
    `, (err, result) => {
        if (err) throw err 
    })

    res.json ({
        message : "Berhasil melakukan transaksi!"
    })
})

app.get('/pembeli/:id/masker', (req, res) => {
    db.query(`
        select masker.warna
        from pembeli
        right join transaksi on pembeli.id_pembeli = transaksi.id_transaksi
        right join masker on transaksi.id_masker = masker.id_masker
        where pembeli.id_pembeli = '`+req.body.id_pembeli+`'
    `, (err, result) => {
        if (err) throw error

        res.json({
            message : "Success!",
            data : result
        })
    })
})

app.get('/transaksi/:id_transaksi', isAuthorized, (req, res) => {
    let sql = `
    select id_masker, id_pembeli, jumlah, total from transaksi
    where id_transaksi = '`+req.params.id_transaksi+`'
    `
    db.query(sql, (err, result) => {
        if(err) throw error

        res.json({
            message : "Success get data detail!",
            data : result[0]
        })
    })
})

//delete transaksi berdasarkan id
app.delete('/transaksi/:id_transaksi', isAuthorized,(req, res) => {
    let sql = `
        delete from transaksi
        where id_transaksi = '`+req.params.id_transaksi+`'
    `
    db.query(sql, (err, result) => {
        if (err) throw err
        
        res.json({
            message: "Success delete data!",
            data: result
        })
    })
})

/********** Run Application **********/
app.listen(port, () => {
    console.log('App running on port ' + port)
})

