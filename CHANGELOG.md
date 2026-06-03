## [1.1.0](https://github.com/SWE-Project-Final-Team/Cayeshni/compare/v1.0.0...v1.1.0) (2026-05-29)

### Features

* **backend:** replace local file storage with Cloudinary ([cf138e7](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/cf138e7854c146442d40b4bc086f7f9112e3f0e7))
* **storage:** add support for local and Cloudinary file storage options ([d97bfd4](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/d97bfd43cf1f92d4e64aad1c001e814310b80fdb))

### Bug Fixes

* **compose:** correct service names and container names in Docker Compose configuration ([516333b](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/516333b826d7286e045f3d4d5224f6d714e54681))
* **config:** update production settings for frontend URL, file storage base URL, and email confirmation requirement ([e2722d2](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/e2722d21111d513fce97af1f5ba155643f8d3de2))
* **database:** prefer database env over DefaultConnection ([ca1ad8b](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/ca1ad8b056113262387c353d91cf253988ab3f1a))
* **ui:** adjust layout and styling in TransactionDetailPanel for better responsiveness ([5905220](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/590522043e9cd71ecae981083a8a2fccb82dec79))

### Documentation

* **readme:** enhance documentation with live deployment links and demo section ([572338d](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/572338dfa9c3a08c9201cb6e77fd1a576fbabc5e))

### Refactoring

* **options:** correct file names of BrevoOptions and DatabaseOptions classes ([10b9b4b](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/10b9b4bb8c2ba45c368f91c4efc9af7ecc05ec47))
* update database connection string configuration logic ([5d65541](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/5d65541300ca27a9d15b1ac5d685f26700bf41da))

### Chores

* allow Vercel preview origin in CORS ([9302ec0](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/9302ec0e1a0c3c9c8f18f02bc3dcd9186a465466))
* **ci:** auto-sync main to develop via GitHub App ([#36](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/36)) ([ed0a566](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/ed0a56602ceeebfcf23bc4839436a76d0dec1176))
* **release:** replace PAT with GitHub App authentication ([09e70e2](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/09e70e2aac90bd9101f5841118e0b36616210ad9))
* **server:** configure Kestrel to listen on all interfaces with PORT env variable ([5abd2cb](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/5abd2cba872f37751c23085b65a6e492db4b956e))

## 1.0.0 (2026-05-18)

### Features

* add all new features (front+back) from experimental branch & restore clean architecture ([#27](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/27)) ([607f4fd](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/607f4fdd0a9b0a17b0ceb0140e644114e1f2869f))
* Add dark theme ([131c5bd](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/131c5bd289cda92eb2e63ec00d63a815c9ae292e))
* Add DefaultCurrency support + group management docs  - Implement Currency field in entity, DTOs, service - Add Mermaid diagrams (use case, sequence, architecture) - API tested and verified ([54b6330](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/54b63308c859166a471af0412bf951615dd72221))
* Add group invites, file uploads and UI tweaks ([0a7ed42](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/0a7ed42c98bfe643b0a59cb8ec85bf4eebaeb409))
* Add show password option ([6ee5b1f](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/6ee5b1fc0cb0f3607028ca4cfd2004f1a240e38f))
* Add transaction edit and settlements UI tweaks ([9e2aceb](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/9e2aceb8d0b08ff988449f3b65eb8f3ebdfacf7a))
* add update group endpoint ([a6f92e0](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/a6f92e012ace75a9aec553efed51a2cc59fd9c31))
* **api:** add Swagger and Scalar OpenAPI documentation ([aaf9c7f](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/aaf9c7f9450d6a69a1ac6762fd5f96e473ba38b8))
* **auth page:** Add auth BFF, UI and /auth/me endpoint ([22c00f1](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/22c00f10eb63ad8aa92c5afe26e50e878e350b22))
* **auth page:** Add auth BFF, UI and /auth/me endpoint ([2c7299a](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/2c7299a2b17f636d536b1d70f11a9c6316a878f8))
* **auth:** add background service for automatic cleanup of expired unverified users ([ca72834](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/ca7283460f145540e8c01de312f8f08cc926d91f))
* **auth:** add background service for automatic cleanup of expired unverified users ([#25](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/25)) ([2869880](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/2869880254d78533a689c376394710b6c1e6b3f9))
* **auth:** implement authentication with JWT access and refresh tokens ([#7](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/7)) ([441bb9a](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/441bb9a7274228c51b8d4c4b7447b5d313bb7fb3)), closes [#8](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/8)
* **auth:** implement JWT authentication with login and registration endpoints ([83a1dc4](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/83a1dc42522dd1307b97d41ebf072dc3efc48b3c))
* **auth:** implement refresh token and logout functionality ([f82e3e2](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/f82e3e2e78f542096e9a15647077a08d92e4693e))
* **auth:** make email confirmation flow anonymous with rate limiting ([19cfdb5](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/19cfdb5b3187c8ed6444df9c315e8b9909ea60c2))
* **cayeshni:** Add dashboard; expand auth, groups, friends ([e324e14](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/e324e14ab78b56b12398b51fbbeb67a1affb5ed9))
* **database:** add asynchronous database initialization and error handling ([1a5689c](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/1a5689c6611a2c9368907348f093f3c6cd6a3e8e))
* **databse:** Add initial database migration with use and switched to Guid for all userId references ([dc76fc0](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/dc76fc091862bf493070f18db15366207e273df9))
* enhance transaction retrieval with split query and improve login page styling ([21eabda](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/21eabda04cdbceefebdb7bcd8e85bf3189652817))
* **friends:** add friendship features like add,view pending,delete,v… ([#26](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/26)) ([e3df03b](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/e3df03b716e336051dbddfaba4307350901f8819))
* **friends:** add friendship features like add,view pending,delete,view friends. added migration to update the friendship entity with new field for senderId. ([2214d1b](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/2214d1bea3033f9238a9a563c3fe0211d8f5a062))
* group management ([#15](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/15)) ([e6e3530](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/e6e35302b962324f6ddf5edadf98bc0f4dcf1cea))
* **groups split flow:** Add profile pics, payer names, balance/UI updates ([88e9497](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/88e949708aadacb1aa06b70b2d9b5ddacbedd006))
* **groups:** add group creation feature ([6cbb571](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/6cbb57152c7689ce20df18f9a4a069dcf4e86028))
* implement transaction deletion functionality and enhance transaction sorting in expenses page ([8a2d751](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/8a2d751fbe5906e984b1b5e9ede0b7d46859fe07))
* implement transactions and settlements system ([c19c209](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/c19c209c8592b3fb2aa0ae0267bcd9ff48de81f7))
* implemented settlements and transactions ([#22](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/22)) ([65df741](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/65df741b1f1d6f42b261e9ae9f461b089ab5f46c))
* initial implementation of system entities ([c2b17a4](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/c2b17a449eb5cab37618c0377e111b585c2512ac))
* initial implementation of system ENUMS ([856f07d](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/856f07d6edc8ef5b7bbe189940cac1cd2669803c))
* Initialize database schema with migrations and create Docker setup ([b8618c8](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/b8618c8abdafea09c6d22fe3ec65dc88a0d1c26a))
* login and signup page ([#21](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/21)) ([e7b8461](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/e7b84618be0c0cd20fdc55c9afd754f0ae9edb3c))
* **migration:** add script to create EF Core migrations easily on windows ([36ef35e](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/36ef35eef3825846de0e6bea790c310cbef04472))
* **profile images:** Implement profile image processing and storage with validations ([067854a](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/067854a45bb640bffc43cef238e2eef8c9cba08b))
* **reset password:** Add reset/forgot pages; tighten auth cookies ([2aea178](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/2aea178d2363154482b8d407b211f2a00b75435f))
* **reset password:** Add reset/forgot pages; tighten auth cookies ([f2a0190](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/f2a0190b88384db048f1c9ecb8b1833120e02e55))
* show member names in expense splits and display settlements inside groups ([a189c74](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/a189c740be3c6e39aaa702c886747bd80659fc20))
* **user-profile:** add image processing and default avatar handling ([f7e264c](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/f7e264c7250f1037d2a34a8a81929a0d4bb85e3b))
* **user-profile:** add profile image processing with default avatar fallback ([#16](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/16)) ([a55259f](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/a55259f5867f8ecb223cb07e1e11ac4df3e8a0a7))
* **users, auth, storage:** complete user system with profile management, auth flows, and file storage ([#14](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/14)) ([d7ef45d](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/d7ef45d3b89d3cc33777d65ade1af130e2323ad1))
* **users:** implement profile management, file upload, and identity email flows ([b47033a](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/b47033a61e2bde34711873c29ed6c78895d35a42))

### Bug Fixes

* **auth:** allow anonymous email confirmation and reset flows ([4fa6492](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/4fa6492a8aef5d78c8f4de96a623a5055732155d))
* **auth:** make email confirmation and password reset accessible without login ([#23](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/23)) ([de6427c](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/de6427cf493bf9709b58474ffd7bbb64368bef91))
* **backend:** enhance exception handling and logging in ExceptionHandlingMiddleware ([9de9c93](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/9de9c93a9fab50779d5decd99daccc871eebd529))
* changed RowVersion to nullable for DB creation ([fa1c89d](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/fa1c89df8df272e08ad9d3139dbe2846251b5c86))
* **config:** align local database fallback credentials ([30de867](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/30de867a1f87dc151e992515558699f1ac612220))
* **config:** align local database fallback credentials ([#4](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/4)) ([cedda01](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/cedda01fcdd9ed8924340ca5a070bae49aba31a8))
* **docker:** update healthcheck command for PostgreSQL service ([d7295eb](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/d7295eba9bee2bd2a5c78ab4016dfb33f01dc77f))
* fixed an issue with db migrations ([2058174](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/205817474a8b1459e4d39a5857b910143e132ffc))
* fixed incorrect import in frontend dockerfile ([4f754e9](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/4f754e985a61699f60f5bfe6b18185dc1cd36652))
* **frontend:** fix settlement endpoint not working on reload by implementing ErrorBoundary component and integrate it into Expenses and Settlements pages ([d7f0f29](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/d7f0f297980e759798d167266cdf8d8f77e10b4a))
* make file storage URLs return explicit default avatar ([860fd59](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/860fd59c227c86b27d06f2e52f18c6ba0a54c93f))
* **settlements:** correct remaining owed calculation in settlements section ([abebb44](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/abebb4419345790b0798a4484a010ccb843cc9d0))
* **tests:** replace string userId with Guid in Group and Transaction tests ([5da7b69](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/5da7b69e02c5e995a96536811eb447de8c19a996))
* **ui:** clean group member focus and selection behavior ([567f6dd](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/567f6ddccc3a703c45aa5c70eb6943ce7d999d19))

### Documentation

* add contributing guide with branching and workflow instructions ([07bea03](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/07bea037bedd6b193dbf767bf670a469d398f00e))
* add mermaid diagram ([335ce6a](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/335ce6aa0d46b76b8012cbbde109c76c5198920f))
* add README and restructure docs folder ([9a4644f](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/9a4644fcee23d5f2d8a78afa6de7bc1cb0cc387e))
* Add SDLC project report (LaTeX + PDF) ([425df51](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/425df51167deeff9f4ed24d2155bcbe2866407e2))
* added database schema documentation and rationale ([e7f3d9e](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/e7f3d9eae96c13a1d5786e6432fe6a71c8acd0ef))
* added diagrams for transactions and settlements ([e0ee6a1](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/e0ee6a1cddcdd1040cf4b86ca5456eaa83ee1036))
* added needed diagrams for friends ([55870f9](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/55870f9d7877e20282bae5068fa600d91a85e1ee))
* added user auth documentation ([aa009a3](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/aa009a3475a7a623cbe584aaafc274a13a89a569))
* adjust SDLC to more closely allign with report requirements ([fd055af](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/fd055afb7f65a8bc5903d83037eb06a7c8b443c2))
* compiled latex pdf ([c1a6b01](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/c1a6b018e1737b856faceb91e6aa4966cae068be))
* Updated schema DOCX and added Class diagram (mermaid) ([#5](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/5)) ([b8ac639](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/b8ac63946eca861d5ad820b2b7d33daf3502ff76))

### Refactoring

* **api:** clean application bootstrap, extract infrastructure setup, add API documentation ([#6](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/6)) ([133f383](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/133f3839f2cfc0485fe4681332b85b3995c0f7ea))
* **auth:** move recovery routes to AuthController ([bccef76](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/bccef7629da3081d929572b44a4935810548a403))
* **auth:** move recovery routes to AuthController ([#24](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/24)) ([0775016](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/0775016b84650fb211b52cb9e058e32b55e47e45))
* **auth:** replace DB refresh tokens with stateless signed JWTs and cookies ([36c1f46](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/36c1f466182471728f78dbd8e18925b899d28c4d))
* **auth:** replace DB refresh tokens with stateless signed JWTs and cookies ([#12](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/12)) ([809ba4c](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/809ba4c4e93ce0b241228c66a8b326b3f017f11d)), closes [#8](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/8)
* **auth:** update token issuance to use AppUser instead of user ID ([8106159](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/81061593da1ec15f504e3c31c6c3802507c18881))
* **backend:** clean up backend structure and improve database initialization ([2f91985](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/2f919859afe4a3e879078917efc97bdf532448cc))
* **backend:** implement clean architecture with separate projects and repository pattern ([e845fca](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/e845fca26129aa86f5a968b07c7cb79b0d0a0a09))
* **backend:** move data protection config into AddInfrastructure ([f4e8f17](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/f4e8f17dea6b270691941ccaa95646eb685b7fcf))
* **backend:** reorganize feature architecture and clean namespaces ([6b48b3b](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/6b48b3b647b2d17922671753acfad712289afb6c))
* **controllers:** replace user ID retrieval with extension method for consistency ([0111aef](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/0111aef80d8fd1d361eb29b2ccc056cd8b6cea61))
* flatten clean architecture into single project structure ([5427aff](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/5427aff14f01d46c61bb97ec5936698fb4484bf1))
* flatten clean architecture into single project structure ([#18](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/18)) ([eda9ee3](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/eda9ee3c7474f23559cd204aa4d7991b87bdeea0))
* groups ([#20](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/20)) ([ae3111f](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/ae3111f986717bb7df2fcddf5da343d18737da6d))
* **groups:** move group service to application layer and use repository in infrastructure ([58c6a62](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/58c6a629ff23516de289f5badd5278e696a1999c))
* **middleware:** streamline exception handling and improve error response structure ([1ae8630](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/1ae863009927856f21124e3b1989025e1d653739))
* move dashboard endpoints into dedicated controller ([709cb85](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/709cb85b9260bf2fb50ffd607760e6d592c951d2))
* moved groups to application layer ([9a12dd4](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/9a12dd446e87cae00926abff630c96b25632e7ae))
* Refactor Group feature boundaries: move service to Application and add Infrastructure repository ([#17](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/17)) ([5338b03](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/5338b03b9cea784817b50dd6df854aba2072240c))
* removed unncessary call to group service validation ([0ad157e](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/0ad157e302a3d056c1bdc38a6ab569c0b755527e))
* **storage:** switch file storage to folder-based relative paths ([2142cbc](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/2142cbc1d17c0b35005ad876555eee1055b21e83))

### Tests

* add unit tests currency, groups, and transactions ([95ec4cb](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/95ec4cbfec74836bfb7822eeb50969e49c6a36e5))
* add unit tests for group features ([b844330](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/b8443307ce8364c467814069728c42e4e15bc5f6))
* added unit testing for friends ([7a00e58](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/7a00e58a1cdc2fce0d88e153ed5b25b1f6b4c95f))
* **auth:** add middleware exception mapping and controller auth metadata tests ([032d6c9](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/032d6c9414d1f81acd8defe0d5bb46aff7892584))
* **auth:** add unit tests for auth flow and JWT service ([6d23076](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/6d2307675a4e19e929f362831a59e78d2c6958d8))
* **auth:** update auth tests for stateless JWT refresh flow ([477dfc3](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/477dfc3c0dd1a7a762e96c9a8565e09e12314ab2))
* **auth:** update test mocks to match ResendConfirmationAsync email parameter ([0eaebea](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/0eaebea5dab2894ad24c898b2b46c2260d5f4490))
* **user:** add profile and storage unit tests ([370ef9a](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/370ef9a0875ed94257e82572b1b190464b1949a1))

### Chores

* Add Cayeshni Next.js frontend scaffold ([#11](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/11)) ([eaebe0a](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/eaebe0a0c1a86a0342e39470eb810ea9b53dc6b9))
* add CODEOWNERS file ([6dfb27a](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/6dfb27aa903fcab4efe6325d611377e95cfd64cd))
* add issue templates for bug reports and feature requests ([0e4d450](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/0e4d450bd745cec1e60867f6c21c5c4cd8ffbf1f))
* add package.json for semantic-release configuration ([d1fad1a](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/d1fad1a10e24c3581c71c0a0bae32707891df0cc))
* adjust docker compose ([d3a040d](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/d3a040d89ea4e821e3e8125b1a5210bf2a485c1e))
* **backend:** rename class for clarity ([68b3db1](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/68b3db11d891271fcb8a6af74f3dcf87e3993df1))
* **database:** add new initial migration for user, group, and transaction entities with relationships ([2121803](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/21218038cbe2e5c615054d28ac0ef41965d69233))
* init commit ([016bdb6](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/016bdb6bccaf92454b44ec2b1f5684a910f2f9e8))
* **release:** migrate to .releaserc.js and remove .releaserc.json [skip ci] ([21bee98](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/21bee98a2f1c16cf3ffef6d5cf59779c0dad4e5e))
* remove test project copy from Dockerfile ([8f85b4a](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/8f85b4ad54ce0b36d85d001e29bf350a24084935))
* renamed Group folder to Groups to be more consistent with other features ([454bd7b](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/454bd7b9496dd15eb05cf82ba4e04c57cb79f97a))
* set up initial backend architecture with project files and configurations ([3ef4d40](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/3ef4d4025c2617c2125c7259ce4219d1ac0f9561))
* update .NET version to 10.x in CI workflow ([0682c37](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/0682c3781319b265674644430d3f23d52f5367db))
* update package-lock.json to add conventional-changelog-conventionalcommits ([3b2464a](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/3b2464aa695b8dba9dd14d9c1daceedcb11070b5))
* update release configuration for improved release process ([407c8b8](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/407c8b8ee85df304d15596213a121be43f19088e))
* update semantic-release configuration ([#28](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/28)) ([997124c](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/997124c51621260ea16fec8b6034fac0dcc60a7a))
* **users:** move user repository inside users folder in features ([23f5045](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/23f50455d1298d8e003aac84adedcf43d51f8a31))

### CI/CD

* add GitHub workflows for CI, PR validation, and release management ([ea3af46](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/ea3af46d11fbba6f5e116e0e7bb906bec364296b))
* refactor GitHub Actions workflows into unified PR validation pipeline ([288a346](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/288a3462b4a2d62473895cfbf2364db1a41c8d99))
* remove semantic PR title enforcement ([034eb22](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/034eb2265a14ac6ef8bce320c4350ea8939aea5f))
* stabilize workflows, fix labeler, and improve CI/CD pipeline ([#2](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/2)) ([67a874a](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/67a874a39cf6cb7099bc4ff1fcb7af368b175dc9))
* unify PR validation, tests, and change detection ([#19](https://github.com/SWE-Project-Final-Team/Cayeshni/issues/19)) ([dfa226b](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/dfa226b55b5add53c9594dfadb430666a51042dc))
* update actions/checkout and actions/setup-node versions in CI and release workflows [skip ci] ([7b5b9aa](https://github.com/SWE-Project-Final-Team/Cayeshni/commit/7b5b9aa34a854bdc9e0655fe8418f518c7d04af8))
