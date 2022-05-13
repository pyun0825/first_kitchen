# First Kitchen
### _공유주방을 위한 배달앱 - 고객측_

![mysql-badge](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white) ![babel-badge](https://img.shields.io/badge/Babel-F9DC3E?style=for-the-badge&logo=babel&logoColor=white) ![bootstrap-badge](	https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white) ![express-badge](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) ![node-badge](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![sequelize-badge](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=Sequelize&logoColor=white) 

- 개발 중 - Currently in development
- 점주측 서버가 열려야 작동 가능 - Has to run parallel to the Shop owner side's server
[점주측 서비스](https://github.com/jungjaechoi/firstKitchen_back)


## 사용 기술
### Frontend
- Pug
- Service Worker
### Backend
- NodeJS (ExpressJS)
- MySQL
- Sequelize
- Web Push Notification
### Open APIs
- Daum Address API
- Kakao Map API


## 기능 (Features)
### 홈 화면
<img src="https://user-images.githubusercontent.com/42465137/167795466-dc2df987-597f-4329-85a5-81c42fd4956c.png" width="250"/>

- 로그인한 유저 3KM 이내의 가게 정보 불러와 표시
- 거리별, 평점 별 ordering 추가 예정

### 가게 상세 화면
<img src="https://user-images.githubusercontent.com/42465137/167795911-222a8282-b955-4f7e-8693-ddcd3adb8c8a.png" width="250"/>

- 찜하기, 리뷰 조회 기능

### 리뷰 내역 화면
<img src="https://user-images.githubusercontent.com/42465137/167796092-bace4385-d655-4f27-b103-601b1b452b4e.png" width="250"/>

### 메뉴 상세 화면
<img src="https://user-images.githubusercontent.com/42465137/167796288-b1f8656e-700f-4320-affc-29485241e208.png" width="250"/>

- 장바구니에 추가 시 동일한 메뉴 있을 시 수량만 update 되도록

### 장바구니 화면
<img src="https://user-images.githubusercontent.com/42465137/167796468-fae28001-a275-4c27-b7be-e2e8edb54659.png" width="250"/>

### 현재 진행중인 주문 화면
<img src="https://user-images.githubusercontent.com/42465137/167796542-59e60d31-c8a5-46f5-bdc2-59ea1bf661a6.png" width="250"/>

- 주문 대기, 접수 상태들인 배달 내역 리스트

### 완료된 주문 내역 화면
<img src="https://user-images.githubusercontent.com/42465137/167796672-de72f84f-2cb8-4c66-a6ea-349a3adb1e83.png" width="250"/>

- 배달 완료, 환불 상태인 주문 내역 리스트
- 배달 완료된 주문에 한해서 리뷰 작성 가능
- 리뷰 작성된 주문 내역 환불 시 리뷰 삭제

### 리뷰 작성 화면
<img src="https://user-images.githubusercontent.com/42465137/167797209-c3251394-362d-4bde-9b25-96ba4e70f10e.png" width="250"/>

### 점주 측에서 주문 상태 변경 시 알림
<img src="https://user-images.githubusercontent.com/42465137/167796852-538edce2-bb50-4d9d-a97e-f957852ca8b2.png" width="250"/>

- Service Worker를 이용해 브라우저를 끈 상태에서도 알람이 오도록 구현


