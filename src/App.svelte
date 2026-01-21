<script lang="ts">
  import type TomSelectType from "tom-select";
  import { onMount } from "svelte";

  interface MemberData {
    storeName: string;
    brands: string;
    alternativeAddr: string;
    alternativeHp: string;
    days: string;
    holidays: "1" | "0" | "";
    worktime: string;
    storeimgURL: string;
    navermapURL: string;
    kakaomapURL: string;
    details: string;
    certification: {
      main: Array<CertFields>;
      sub: Array<CertFields>;
    };
  }

  interface CertFields {
    storeName: string;
    companyName: string;
    email: string;
    ceoName: string;
    phoneNum: string;
    uuid: string;
    storeAddr: string;
  }

  let memberSelection: HTMLInputElement | undefined = $state();
  let member: string | undefined = $state();
  let memberData: MemberData | undefined = $state();

  let memberType: "0" | "1" | "2" | "3" = $state("0");
  let partnersForm: HTMLFormElement | undefined = $state();

  let ts: TomSelectType | undefined = $state();

  let membersList = $state<Array<{ mb_no: string; mb_id: string; mb_nick: string; mb_5: string; mb_6: string; mb_8: string }>>([]);

  let mb_nick_param: string | null | undefined = $state();

  const certTemplate: CertFields = {
    storeName: "",
    companyName: "",
    email: "",
    ceoName: "",
    phoneNum: "",
    uuid: "",
    storeAddr: "",
  };

  $effect(() => {
    if (mb_nick_param && ts) {
      ts.setValue(mb_nick_param);
    }
  });

  onMount(async () => {
    mb_nick_param = new URL(location.href).searchParams.get("mb_nick");
    try {
      const response = await fetch("https://b2b.soundcat.com/page/get_members.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "use-Dev": "true",
        },
        body: JSON.stringify({
          onlypartners: true,
          partners: true,
        }),
      });
      const result = await response.json();

      if (result.result !== "success") throw new Error(result.message || "Failed to fetch members");
      membersList = result.data;
      if (memberSelection)
        ts = new TomSelect(memberSelection, {
          plugins: ["optgroup_columns"],
          options: membersList,
          maxOptions: undefined,
          maxItems: 1,
          placeholder: "업체명 선택...",
          valueField: "mb_nick",
          labelField: "mb_nick",
          searchField: ["mb_nick"],
          optgroups: [
            {
              value: "0",
              label: "취급유형: 표시 안함",
            },
            {
              value: "1",
              label: "취급유형: 프로오디오",
            },
            {
              value: "2",
              label: "취급유형: 컨슈머오디오",
            },
            {
              value: "3",
              label: "취급유형: 모두 취급",
            },
          ],
          optgroupField: "mb_5",
          onChange: (value: string | undefined) => {
            member = value;
            const result = membersList.find(obj => obj.mb_nick === value);

            if (!value) return;
            let json;
            try {
              if (!(result && result.mb_6)) throw new Error("No mb_6 data");
              json = JSON.parse(result.mb_6);
            } catch (error) {
              console.warn("JSON 파싱이 실패했습니다.");
              console.warn(error);
              console.warn(result?.mb_6.replaceAll("\n", "\\n"));
            }
            memberType = result ? (result.mb_5 as "0" | "1" | "2" | "3") : "0";

            if (json && typeof json === "object" && !json.certification) {
              json.certification = {
                main: [
                  {
                    storeName: "",
                    companyName: "",
                    email: "",
                    ceoName: "",
                    phoneNum: "",
                    uuid: "",
                  },
                ],
                sub: [],
              };
            }

            memberData = json ?? {
              storeName: value,
              brands: "",
              alternativeAddr: "",
              alternativeHp: "",
              days: "",
              holidays: "",
              worktime: "",
              storeimgURL: "",
              navermapURL: "",
              kakaomapURL: "",
              details: "",
              certification: {
                main: [
                  {
                    storeName: "",
                    companyName: "",
                    email: "",
                    ceoName: "",
                    phoneNum: "",
                    uuid: "",
                    storeAddr: "",
                  },
                ],
                sub: [],
              },
            };

            const url = new URL(location.href);
            url.searchParams.set("mb_nick", value);
            history.pushState(null, "", url);
          },
          render: {
            optgroup_header: function (data: { label: string; value: string }, escape: (str: string) => string) {
              return '<div class="optgroup-header">' + escape(data.label) + "</div>";
            },
          },
        });
    } catch (e) {
      console.error("Error fetching members:", e);
    }
  });

  async function submitAction(event: Event) {
    event.preventDefault();
    console.log("Submitting form...");
    if (!member || !partnersForm) return;

    const formData = new FormData(partnersForm);

    const dataToSend: any = {};
    formData.forEach((value, key) => {
      dataToSend[key] = value;
    });
    dataToSend.mb_nick = member;
    dataToSend.mb_5 = memberType;
    dataToSend.mb_6 = {
      ...memberData,
      brands: dataToSend.brands.split(",").map((str: string) => str.trim()),
      storeimgURL: dataToSend.storeimgURL.split(",").map((str: string) => str.trim()),
    };

    try {
      const response = await fetch("https://b2b.soundcat.com/page/get_partners.php", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "use-Dev": "true",
        },
        body: JSON.stringify(dataToSend),
      });
      const result = await response.json();

      if (result.result !== "success") throw new Error(result.message || "Failed to update partner");
      alert("저장이 완료되었습니다.");
    } catch (e) {
      console.error("Error updating partner:", e);
      alert("저장 중 오류가 발생했습니다.");
    }
  }
</script>

<main class="_app">
  <h4>파트너스 정보 관리 & 온라인 정품 인증서 관리</h4>
  <blockquote><a href="https://www.soundcat.com/partners" target="_blank">홈페이지 파트너스 페이지</a>에 보일 업체 정보를 관리합니다.</blockquote>
  <div class="memeberSel">
    <input type="text" id="memberSelection" bind:this={memberSelection} />
  </div>
  {#if member && memberData}
    <div class={"data"}>
      <div class="content">
        <h5 id="mb_nick">{member}</h5>
        <form
          name="partners_form"
          bind:this={partnersForm}
          id="partnersForm"
          onsubmit={e => {
            e.preventDefault();
            submitAction(e);
          }}>
          <div class="_row">
            <div class="_col _col-2">
              <span class="label">매장 이름</span>
              <label class="input"><input type="text" name="storeName" bind:value={memberData.storeName} /></label>
            </div>
            <div class="_col _col-2">
              <span class="label">취급 유형</span>
              <label class="select">
                <select name="mb_5" bind:value={memberType}>
                  <option value="0">표시 안함</option>
                  <option value="1">프로오디오</option>
                  <option value="2">컨슈머오디오</option>
                  <option value="3">모두 취급</option>
                </select>
              </label>
            </div>
            <div class="_col _col-4">
              <span class="label">청음 및 시연 가능 브랜드</span>
              <label class="input"><input type="text" name="brands" bind:value={memberData.brands} /></label>
            </div>
            <div class="_col _col-4">
              <span class="label">대체 주소 <span class="small">(공백시 업체 가입 정보 사용)</span></span>
              <label class="input"><input type="text" name="alternativeAddr" bind:value={memberData.alternativeAddr} /></label>
            </div>
          </div>
          <div class="_row">
            <div class="_col _col-3">
              <span class="label">대체 전화번호 <span class="small">(공백시 업체 가입 정보 사용)</span></span>
              <label class="input"><input type="text" name="alternativeHp" bind:value={memberData.alternativeHp} /></label>
            </div>
            <div class="_col _col-3">
              <span class="label">매장 운영 요일</span>
              <label class="input"><input type="text" name="days" bind:value={memberData.days} /></label>
            </div>
            <div class="_col _col-3">
              <span class="label">공휴일 운영 여부</span>
              <div class="radio_innit">
                <label for="open" class="radio">
                  <input type="radio" id="open" name="holidays" value="1" bind:group={memberData.holidays} /><i></i>공휴일 운영
                </label>
                <label for="close" class="radio">
                  <input type="radio" id="close" name="holidays" value="0" bind:group={memberData.holidays} /><i></i>공휴일 휴무
                </label>
              </div>
            </div>
            <div class="_col _col-3">
              <span class="label">매장 운영 시간</span>
              <label class="input"><input type="text" name="worktime" bind:value={memberData.worktime} /></label>
            </div>
          </div>
          <div class="_row">
            <div class="_col _col-6">
              <span class="label">네이버 지도 URL</span>
              <label class="input"><input type="text" name="navermapURL" bind:value={memberData.navermapURL} /></label>
            </div>
            <div class="_col _col-6">
              <span class="label">다음 지도 URL</span>
              <label class="input"><input type="text" name="kakaomapURL" bind:value={memberData.kakaomapURL} /></label>
            </div>
          </div>
          <div class="_row">
            <div class="_col">
              <span class="label">매장 사진</span>
              <label class="input"><input type="text" name="storeimgURL" bind:value={memberData.storeimgURL} /></label>
            </div>
          </div>
          <div class="_row">
            <div class="_col">
              <span class="label">매장 안내</span>
              <label class="textarea details">
                <textarea name="details" rows="7" bind:value={memberData.details}></textarea>
              </label>
            </div>
          </div>
          <hr />
          {#snippet certFields(object: CertFields, title: string, index: number, type: "main" | "sub")}
            <div class="main-cert field bottom-hr">
              <div class="_row">
                <div class="_col _col-4">
                  <span class="label">{title} 거래처 상호명</span>
                  <label class="input"><input type="text" name="main-cert-company" bind:value={object.companyName} /></label>
                </div>
                <div class="_col _col-4">
                  <span class="label">{title} 거래처 스토어명</span>
                  <label class="input"><input type="text" name="main-cert-store" bind:value={object.storeName} /></label>
                </div>
                <div class="_col _col-4">
                  <span class="label">거래처 이메일</span>
                  <label class="input"><input type="text" name="main-cert-email" bind:value={object.email} /></label>
                </div>
              </div>
              <div class="_row">
                <div class="_col _col-4">
                  <span class="label">대표자 성함</span>
                  <label class="input"><input type="text" name="main-cert-ceo" bind:value={object.ceoName} /></label>
                </div>
                <div class="_col _col-4">
                  <span class="label">업체 연락처</span>
                  <label class="input"><input type="text" name="main-cert-phoneNum" bind:value={object.phoneNum} /></label>
                </div>
                <div class="_col _col-4">
                  <span class="label">거래처 주소</span>
                  <label class="input"><input type="text" name="main-cert-addr" bind:value={object.storeAddr} /></label>
                </div>
              </div>
              <div class="flex align-end gap-1em flex-wrap mb-1em">
                <div class="flex align-end gap-1em">
                  <div class="flex-grow">
                    <span class="label">식별번호</span>
                    <label class="input"><input type="text" name="main-cert-uuid" class="uuid" value={object.uuid} readonly /></label>
                  </div>
                  <button
                    class="customBtn issueCode"
                    type="button"
                    onclick={() => {
                      object.uuid = crypto.randomUUID();
                    }}>식별번호 발급</button>
                </div>
                <div class="flex-grow href_work">
                  <span>온라인 정품인증서 주소</span>
                  <input type="text" value={Object.values(object).every(value => !!value) ? `https://b2b.soundcat.com/cert/${object.uuid}.gif` : ""} readonly disabled={!object.uuid} onfocus={e => e.currentTarget.select()} />
                  <button type="button">복사</button>
                </div>
              </div>
              <div class="flex">
                <div class="flex-grow"></div>
                <button type="button" class="customBtn" onclick={() => memberData?.certification[type].splice(index, 1)}>삭제</button>
              </div>
            </div>
          {/snippet}
          <div class="cert-section m-b-20">
            <h5 class="m-b-20">온라인 정품 인증서 관리</h5>
            <div class="bottom-hr">
              {#each memberData.certification.main as mainCert, index (index)}
                {@render certFields(mainCert, "메인" + (index + 1), index, "main")}
              {/each}
              <div class="flex">
                <div class="flex-grow"></div>
                <div><button class="customBtn add-item" type="button" title="메인 거래처 추가" onclick={() => memberData?.certification.main.push({ ...certTemplate })}><i class="fas fa-plus"></i> 메인 거래처 추가</button></div>
              </div>
            </div>
            <div class="bottom-hr">
              {#each memberData.certification.sub as subCert, index (index)}
                {@render certFields(subCert, "하부" + (index + 1), index, "sub")}
              {/each}
              <div class="flex">
                <div class="flex-grow"></div>
                <div><button class="customBtn add-item" type="button" title="하부 거래처 추가" onclick={() => memberData?.certification.sub.push({ ...certTemplate })}><i class="fas fa-plus"></i> 하부 거래처 추가</button></div>
              </div>
            </div>
          </div>
          <div class="submit">
            <button id="submit" class="btn-e btn-e-green btn-e-lg">저장</button>
          </div>
        </form>
      </div>
    </div>
  {:else}
    <div class="data nodata"></div>
  {/if}
</main>

<style>
  * {
    box-sizing: border-box;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 0;
  }
  #memberSelection {
    visibility: hidden;
  }

  :global(.ts-control) {
    height: 38px;
    overflow-y: hidden;
  }

  :global(.ts-control input),
  :global(.ts-control input:focus) {
    border: none !important;
  }

  :global(.ts-dropdown .optgroup-header) {
    background: #f2f2f2;
    color: #aaa;
  }

  :global(.ts-control),
  .data .content :is(input[type="text"], textarea, .radio_innit, select) {
    border-radius: 5px;
    box-shadow: 0 2px 4px #00000022;
    border: 1px solid #ddd;
    outline: none;
  }

  .data {
    margin-top: 20px;
  }

  .data.nodata::after {
    content: "먼저 업체명을 선택하세요.";
    display: block;
    color: #ccc;
    background-color: #eee;
    text-align: center;
    padding: 120px 0;
    border-radius: 20px;
  }

  .data .content {
    padding: 20px;
    background: #eee;
    border-radius: 20px;
  }

  #mb_nick {
    margin-bottom: 20px;
  }

  .data .content :is(input[type="text"], textarea, .radio_innit, select) {
    padding: 0.5em;
    width: 100%;
    font-size: 1em;
  }

  .data .content span.label {
    margin-left: 10px;
    background: white;
    border-radius: 5px 5px 0 0;
    padding: 5px 10px;
    margin-bottom: -5px;
    border: 1px solid #d5d5d5;
    display: inline-block;
    font-weight: bold;
    font-size: 1em;
    color: black;
  }

  .data .content label {
    display: block;
  }

  .data .content .radio_innit {
    background: white;
    padding: 0 10px;
    margin: 0;
    border: 1px solid #d5d5d5;
    position: relative;
    z-index: 2;
    height: 38px;
    display: flex;
    justify-content: space-around;
    align-items: center;
  }

  .radio_innit label.radio {
    margin: 0;
  }

  .radio_innit label.radio {
    margin: 0;
  }

  .submit {
    text-align: right;
  }

  #submit {
    box-shadow: 0 2px 4px #00000022;
  }

  a {
    color: blue;
  }

  .customBtn {
    border: 1px solid #fff;
    border-radius: 999px;
    background: #88a;
    color: white;
    display: inline-flex;
    align-items: center;
    padding: 0.5em 1em;
    box-shadow: 0 1px 3px #0004;
    gap: 0.5em;
  }

  .flex {
    display: flex;
  }

  .flex-grow {
    flex-grow: 1;
  }

  .flex-wrap {
    flex-wrap: wrap;
  }

  .align-center {
    align-items: center;
  }

  .align-end {
    align-items: flex-end;
  }

  .gap-1em {
    gap: 1em;
  }

  .bottom-hr {
    padding-bottom: 1em;
    margin-bottom: 1em;
    border-bottom: 1px solid #0002;
  }

  div:has(> .href_work) {
    max-width: 100%;
  }

  .href_work {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
  }

  .href_work span {
    background: white;
    padding: 0.5em;
    border-radius: 8px 0 0 8px;
    border: 1px solid #ccc;
    border-right: none;
  }

  .href_work input {
    background: white;
    border: 1px solid #ccc;
    padding: 0.5em;
    font-size: 1em;
    outline: none;
    border-radius: 0 !important;
    box-shadow: none !important;
    width: unset !important;
    flex-grow: 1;
  }

  .href_work button {
    background: #eee;
    font-size: 1em;
    padding: 0.5em;
    border-radius: 0 8px 8px 0;
    border: 1px solid #ccc;
    border-left: none;
  }

  .mb-1em {
    margin-bottom: 1em;
  }

  .small {
    font-size: 0.85em;
    color: #666;
    font-weight: normal;
  }

  ._row {
    display: flex;
    gap: 1em;
    margin-bottom: 1em;
  }

  ._col {
    flex-grow: 1;
  }

  ._col-2 {
    flex-basis: calc(16.66% * 2 - 0.666em);
  }

  ._col-3 {
    flex-basis: calc(16.66% * 3 - 0.666em);
  }

  ._col-4 {
    flex-basis: calc(16.66% * 4 - 0.666em);
  }

  ._col-6 {
    flex-basis: calc(16.66% * 6 - 0.666em);
  }
</style>
