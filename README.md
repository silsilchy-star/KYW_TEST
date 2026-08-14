# 반응속도 측정 웹앱

버튼을 누르면 게임이 시작되고, 화면이 빨간색으로 바뀌는 순간부터 클릭까지 걸린 시간(ms)을 측정하는 웹앱입니다. 결과는 Firebase(Firestore)에 닉네임과 함께 저장되고, 최고 기록 랭킹을 볼 수 있습니다.

## 동작 방식

1. 시작 버튼을 누르면 화면이 파란색(대기 상태)이 됩니다.
2. 1~12초 사이 랜덤한 시간이 지나면 화면이 빨간색으로 바뀝니다.
3. 빨간색이 된 후 클릭하면 반응 시간(ms)이 초록색 화면에 표시됩니다.
4. 결과 화면에서 닉네임을 입력하고 저장하면 Firestore에 기록이 저장되고, 최고 기록 랭킹(상위 5개)이 표시됩니다.
5. 빨간색이 되기 전에 클릭하면 실패 처리되고, 버튼을 눌러 다시 시작할 수 있습니다.

## 폴더 구조

```
frontend/                 # GitHub Pages로 배포되는 정적 프론트엔드
  index.html
  style.css
  js/
    firebase-config.js    # Firebase 프로젝트 설정값 (직접 채워야 함)
    firebase.js           # saveScore(ms, nickname), getTop(n)
    game.js                # 게임 상태 머신 / UI 로직
firestore.rules           # Firestore 보안 규칙
firebase.json             # firebase CLI로 규칙만 배포하기 위한 설정
.github/workflows/deploy-pages.yml  # GitHub Pages 배포 워크플로우
```

## 점수 저장/조회 API

`frontend/js/firebase.js`에서 두 함수만 외부로 노출합니다.

- `saveScore(ms, nickname)`: Firestore `scores` 컬렉션에 `{ nickname, ms, createdAt }` 문서를 추가합니다.
- `getTop(n)`: `ms` 오름차순으로 상위 `n`개 기록을 반환합니다.

## Firebase 설정하기 (필수)

앱이 실제로 저장/조회를 하려면 본인의 Firebase 프로젝트가 필요합니다.

1. [Firebase 콘솔](https://console.firebase.google.com/)에서 새 프로젝트를 만듭니다.
2. Firestore Database를 생성합니다(위치는 임의로 선택 가능).
3. 프로젝트 설정 > 일반 > "내 앱"에서 웹 앱을 추가하고 나오는 config 값을 복사합니다.
4. Firestore 보안 규칙을 배포합니다.
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add          # 본인의 projectId 선택
   firebase deploy --only firestore:rules
   ```

`firebase-config.js`의 값들은 클라이언트에 노출되는 식별자일 뿐 비밀키가 아니므로 커밋해도 안전합니다. 실제 접근 제어는 `firestore.rules`가 담당합니다(닉네임 1~20자, ms는 0~20000 사이의 숫자인 새 문서 생성만 허용, 수정/삭제 불가). 다만 이 저장소는 값을 GitHub Actions Secrets로 관리하고, 배포 시점에만 파일을 생성합니다(아래 참고).

## 로컬에서 실행하기

ES 모듈을 사용하므로 `file://`로 바로 열면 동작하지 않습니다. 로컬 서버로 열어주세요.

로컬 실행 시에는 CI가 대신해주는 config 생성 단계가 없으므로, `frontend/js/firebase-config.js`의 `REPLACE_ME` 부분을 본인의 Firebase config 값으로 직접 채운 뒤 실행하세요(이 파일은 로컬에서만 수정하고 커밋하지 않는 것을 권장합니다).

```bash
cd frontend
python3 -m http.server 8080
# 또는: npx serve .
```

브라우저에서 `http://localhost:8080` 접속.

## GitHub Pages 배포

`.github/workflows/deploy-pages.yml`이 `main` 브랜치에 푸시될 때 다음 순서로 GitHub Pages에 배포합니다.

1. 저장소 Settings > Pages > Source를 "GitHub Actions"로 설정합니다.
2. 저장소 Settings > Environments > `github-pages` > Deployment branches and tags 에서 `main`이 배포 가능하도록 허용합니다("No restriction" 또는 `main` 추가).
3. 저장소 Settings > Secrets and variables > Actions 에 아래 이름으로 Firebase config 값을 등록합니다.
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
4. `main`에 푸시되면 워크플로우가 이 Secrets 값으로 `frontend/js/firebase-config.js`를 생성한 뒤 배포합니다. 저장소에 커밋된 `firebase-config.js`는 항상 플레이스홀더 상태로 유지되고, 실제 값은 빌드 아티팩트에만 존재합니다.
