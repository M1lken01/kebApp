DROP DATABASE IF EXISTS kebAppDb;
CREATE DATABASE IF NOT EXISTS kebAppDb;
USE kebAppDb;

CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(32) NOT NULL,
    password_hash VARCHAR(64) NOT NULL,
    email VARCHAR(128) NOT NULL,
    token VARCHAR(128) NOT NULL,
    picture BOOLEAN NOT NULL DEFAULT false,
    permission ENUM ("admin", "moderator", "vip", "member", "banned") DEFAULT "member" NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE Referrals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    secret VARCHAR(64) NOT NULL,
    expired BOOLEAN DEFAULT false NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_on TIMESTAMP NOT NULL
);

CREATE TABLE Groupchats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(64) NOT NULL,
    picture BOOLEAN DEFAULT false NOT NULL,
    participants JSON NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE Messages (
	id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT DEFAULT NULL,
    group_id INT DEFAULT NULL,
	content TEXT NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES Users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (group_id) REFERENCES Groupchats(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_sender_id (sender_id),
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_group_id (group_id)
);

CREATE TABLE Friendships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id_1 INT NOT NULL,
    user_id_2 INT NOT NULL,
    state ENUM('pending', 'accepted') DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id_1) REFERENCES Users(id),
    FOREIGN KEY (user_id_2) REFERENCES Users(id),
    UNIQUE KEY unique_friendship (user_id_1, user_id_2)
);

/* create admin user */
INSERT INTO Users (username, password_hash, email, token, permission, picture)
SELECT 'admin', 'admin', 'admin@noname.dev', 'admin', 'admin', 1
WHERE NOT EXISTS (
    SELECT 1 FROM Users WHERE username = 'admin'
);

/* create public group */
INSERT INTO Groupchats (title, participants) VALUES ('public', JSON_ARRAY(1));

/* referrals */
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('paksane.karcub.agnes', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('poor.adrienn', false, '2023-10-15 23:59:59');

INSERT INTO Referrals (secret, expired, expires_on) VALUES ('artner.milan.kende', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('doboczky.hunor', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('farkas.lilla', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('farkas.vanessza', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('fazekas.balint', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('foszler.daniel.alexander', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('hargitai.tamas', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('hegyi.marcell', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('holdosi.luca.annabella', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('kiss.adrian', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('kovacs.nora', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('pingitzer.david', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('pinter.kitti.kira', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('rosta.balazs', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('soros.levente', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('szalai.dora', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('szilagyi.zoe.judit', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('tal.kristof', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('turoczi.regina', false, '2023-10-15 23:59:59');
INSERT INTO Referrals (secret, expired, expires_on) VALUES ('weisz.boglarka.lilian', false, '2023-10-15 23:59:59');

/*INSERT INTO Friendships (user_id_1, user_id_2, state) VALUES (2, 1, 'accepted');*/

