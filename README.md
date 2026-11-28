# cheonha
## 저장 공간 규칙 (2026-11-28)
이 저장소의 모든 게임은 같은 주소(pyungbum87-create.github.io)라서 **브라우저 저장 공간(localStorage·IndexedDB)을 함께 씁니다.**
- 저장 이름은 게임마다 고유한 앞말을 붙인다(예: `nanse5-`, `dr_`, `vegdef3d_`, `doomsday_`). 다른 게임과 같은 이름을 쓰지 않는다. 게임을 복사해 새 폴더를 만들면 저장 이름도 바꾼다.
- `localStorage.clear()` 금지. 초기화는 자기 앞말로 시작하는 저장만 지운다.
- 점검: `python3 nanse2/tools/storage_scan.py` (전체 삭제·훑어 지우기·이름 충돌 목록)
- 2026-11-28 수정: doomsday 초기화가 전체를 지우던 것 → `doomsday`로 시작하는 저장만 / garden3d가 garden과 같은 `vegdef_`를 쓰던 것 → `vegdef3d_`(처음 한 번 옮겨 담기) / town2가 town과 같은 `tt-photo-v2`를 쓰던 것 → `tt-photo-v2-town2`(처음 한 번 옮겨 담기)
