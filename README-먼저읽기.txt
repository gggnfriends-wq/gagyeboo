우리집 가계부 신규 가계부 사이트 배포 파일

주요 파일
- public/우리집 가계부.html : 가계부 화면 본 파일
- public/index.html : 사이트 첫 주소(/)로 접속하면 우리집 가계부.html을 엽니다.
- public/apple-touch-icon.png : 아이폰 홈 화면 아이콘
- netlify/functions/ : 우리집 가계부 신규 회원가입/로그인/데이터 저장 API
- supabase/schema.sql : 새 Supabase 데이터베이스 테이블 생성 SQL
- netlify.toml : Netlify 배포 설정

배포 순서
1. ZIP을 PC에서 압축 해제합니다.
2. GitHub 저장소 우리집 가계부 첫 화면에서 Upload files를 선택합니다.
3. 압축을 푼 폴더 안의 파일과 폴더 전체를 저장소 루트에 업로드합니다. ZIP 자체를 올리지 마세요.
4. 새 Supabase 프로젝트를 만들고 SQL Editor에서 supabase/schema.sql 전체를 실행합니다.
5. Netlify에서 새 사이트를 GitHub 저장소와 연결합니다.
6. Netlify 환경변수에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET을 등록합니다.
   - SUPABASE_SERVICE_ROLE_KEY는 서버 전용 비밀키입니다. HTML이나 GitHub에 넣지 마세요.
   - JWT_SECRET은 충분히 길고 무작위인 새 값을 만들어 Netlify에만 입력하세요.
7. Netlify에서 배포한 뒤 회원가입, 로그인, 데이터 저장을 테스트합니다.

중요
- 기존 서비스의 데이터베이스/로그인/저장소와 연결하지 않는 신규 구성입니다.
- 브라우저 저장 키, 데이터 테이블, 데이터 API 이름도 우리집 가계부로 변경했습니다.
- public/index.html은 Netlify 기본 첫 화면 주소를 유지하기 위한 연결 파일이며 실제 앱 HTML은 우리집 가계부.html입니다.
- 아직 실제 Supabase/Netlify에 배포해 동작을 검증한 상태는 아닙니다.
