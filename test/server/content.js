const Router = require('koa-router');
const axios = require('axios');
const faker = require('faker');

const router = new Router();
const BASE_URL_CONTENT = `/content`;
const BASE_URL_HOME = `/home`;
const CFS_ADDRESS = 'http://localhost:3000';

let homeListings = {};
homeListings['drama'] = [
  "61dba3c3-2cfe-48b3-98b7-5a129f203e0a",
  "c2526b08-edba-4424-9d2c-a9734536c028",
  "ec780b2c-6d1e-4952-9d17-5b6070886801",
  "b0f7ebad-59db-4ec2-b769-1cf47fd6ba6c",
  "8e95801a-85d9-43a3-9997-e59135e40b7c",
  "1086a333-93bc-47ea-87be-408158be26f6",
  "6e0855cf-fdff-4455-a2c1-4ad65d1d48f9",
  "963c63d8-6d43-4b2c-a1a3-faa52bfca924",
  "f2cb4ecb-bae4-4c42-987d-79bfa08fda66",
  "55a09103-8a98-48b7-a204-4f90dd2cc808",
  "d38001e1-80af-4414-bed0-d34df366e2dd",
  "436eea47-8546-4351-b7d7-5db397d4c511",
  "fe216f22-ff1e-4248-8539-83985e0c891b",
  "cea53d30-6d51-432f-a97e-b3f319b0b9c4",
  "855a62e3-f5ad-4b4a-a63b-3c5f648f1853",
  "dc6105b4-966c-4628-8303-60cb16ebfa73",
  "d009d01f-cfd5-4ca0-9863-580edcee1ff0",
  "1114e90d-8aba-45ab-939a-9843427bb93f",
  "7345746e-8136-4e9a-a40c-25d5095b0ed5",
  "07923ccf-8efa-48c1-8a3e-d49fc564d925",
  "94ae4db9-6e30-4655-8e8c-59405f0357d6",
  "a7e57d3b-21a3-42b8-a2d2-ce05db47fd43",
  "e2375e7b-6aff-4559-bf12-53f40e73b7ea",
  "e878ea43-9572-436d-9204-7fb319cf5f89",
  "197bbe62-ef18-41c6-917a-3373068a650e",
  "3564ab27-5154-4420-950a-56d7fb10726c",
  "47a138ea-40ac-45ba-ae15-32dd28486771",
  "12086cd5-d33a-4da9-863d-de97381ad601",
  "4f311206-a3aa-4c99-919d-068373fb820d",
  "9d56a21d-e288-4e16-8350-7c2905e866df",
  "93ec18a6-dd54-4b85-ace8-0fd6c11bb6bc",
  "27fd2650-5b29-458f-8c2c-28e2a8a93b00",
  "d0a8a0e1-4e84-4da0-8f96-50cad0410ce3",
  "a38d3a4d-ae08-4532-82dc-217578246c71",
  "bc8adf6c-98da-4a70-8df8-7b0d171a543a",
  "c0aae338-579e-4c5e-8f19-8048d5ffa1f6",
  "f0f2ab27-3a8a-4be9-8206-47a2026a2e9f",
  "96ec2bb1-3511-4695-a4ec-29df6c2aeda1",
  "24f564d6-7f44-4bf5-a5f3-363da8326826",
  "ddac0391-abd2-4e0c-9ee0-df47af100241",
  "0979fefc-2ded-496a-9c82-768acc0c654b",
  "e84639c4-2d5a-4d65-8f26-09d5be5e1c51",
  "667ea87b-92c1-4129-abea-ff27674b559c",
  "57dce6ff-df5b-48a1-a9bb-d2cb999301ae",
  "4b47665b-9766-42a4-bcb8-b8b7aba4ec41",
  "1a087df8-b781-4276-9e47-80b02e06a564",
  "db5a519f-b9cf-40e0-bbc5-5d1ddfff50a1",
  "9530bb1d-d1c3-41f2-a046-677dbbc3abaa",
  "8394d992-fdc1-4c08-a12b-073c2465af78",
  "930e901c-3dd7-40d9-b04e-fd384fa4d967",
  "a3856d7b-3710-48ac-978b-0cb3458061ef",
  "9f26a4a0-1701-4de8-9fc5-52c38265d913",
  "66c43cfd-d135-40d1-90cc-3727d867579f",
  "b6de5933-abc1-4fe7-9a09-8b2beb67ed20",
  "fabb9001-c11c-4408-8b70-dd73b6c17819",
  "648d57b4-79ea-4e45-819d-53d90784a549",
  "f30df6d3-3a2f-4d01-b894-d4bd90c2b637",
  "598f6265-06ad-484c-a2ef-83ce269d171d",
  "dd163995-4029-4cf5-8f6a-661cd9c42b29",
  "41820c0e-3380-4254-9064-36e1ae9f016d",
  "c518061b-ae7f-4398-b59d-22aee956ec4f",
  "211fef7d-f645-435b-9e2b-137ebbd3af1b",
  "e71b9c35-caa7-40cd-9e25-da8a3c085ce6",
  "e233a402-34ef-4415-9244-17d177f0880c",
  "c1754cc1-c1f9-49a5-bb8a-891fb546f3b0",
  "8372cef1-e0d1-4129-9b28-58d1d6995c9d",
  "ee67c7d6-1811-4b13-851a-1d16e1fa97f0",
  "7a61b6e2-5b62-4d81-8b87-dec0217d4aa5",
  "e6b61ea6-a077-4faf-8211-b6033d65302d",
  "8f96393f-4327-4813-8267-d14f24f6ddf7",
  "8a3e22ca-7243-465f-84ee-98101499e55b",
  "92b51dd2-5710-49ab-8b70-f99a474631de",
  "ff48231a-d8a9-40f9-b431-4026abc13896",
  "8f448432-d9cc-4094-b454-a332ba0da16a",
  "b2920812-c468-481b-8cc1-5483240ad8a0",
  "39000df5-b567-4a06-afdf-4f4bea6d4344",
  "9e9706f2-cb23-4f4c-9d5f-06566836214b",
  "0553d7f0-45a0-4567-b888-edf8860ce75e",
  "b2785e34-8bdc-4a57-b8a9-2cdd8fd64ba8",
  "5d04b3a7-fc21-450d-a4d1-dccc4bbd4839",
  "7ae5e131-4028-4030-9d1a-ae2ab7af3e23",
  "9cd9ddd2-404f-4407-a0c1-c942ca3af425",
  "58c2c483-15f2-4a17-a6f1-423dd275a7d0",
  "04a0d814-b921-4558-9574-f0edd6ccc2bc",
  "fa486e25-e7db-4513-a710-5f97a80c960c",
  "df7dc67b-e982-4940-b308-f5c0b1700245",
  "62abd2f1-93d5-4792-87c0-83d0c334fd26",
  "19fafea9-99f8-4456-bae5-abeadcf66c77",
  "41dd564b-f9bd-48a7-87fd-9b5fec762109",
  "90ed23e5-f2f9-41d5-b68d-03249d91f107",
  "1627f3ac-224d-4f0f-a50d-fa9acdb9189d",
  "4f62e64f-4782-404c-ad57-42340a556280",
  "7d6a1471-57a5-4062-8207-a315e7b09376",
  "bf6be057-f261-40cc-971a-569abbbe1ce5",
  "75703c5e-c38f-43cf-86d6-ed6c1d4867c0",
  "ce7ce4a2-b847-405c-a137-7cf2fc6d7c44",
  "10802ec9-7fa2-4a12-9f8f-e28b4b4de6c6",
  "0d22d58b-b548-4651-aabd-01c00b535721",
  "4708619b-4e8d-4e9b-a4b2-9690d417c12c",
  "f2287049-c817-435d-a312-1fdb1bb92349"
];
homeListings['comedy'] = [
  "c8f22eac-6845-4518-bd52-0a6b2a58f4d8",
  "3bb418f0-4459-4c02-9f7a-e77efaf985e4",
  "281a3a3e-da98-44b8-9570-1e6369317880",
  "35cfe84f-a5a4-424f-8096-e035dabbd668",
  "becdeec6-d5b7-4812-a229-58d89f3e1886",
  "3f1d5b4c-e1f2-4f3d-a60c-6f41f202be48",
  "9b91c126-2e28-4e64-bc5e-2cd1240d7f2e",
  "e26aceaa-f5b7-4a53-9313-a3f8aaac37ab",
  "098ab6a3-2a1a-47f7-a68f-2e65260eca98",
  "ee743588-3f89-4ea4-88b2-7832e321ded6",
  "d78fd2f8-1a0f-4f52-9824-3141bb85e2f2",
  "706bc4e0-7ccc-4826-b17e-72004e0c06e6",
  "15f2ea48-dc8f-40c9-a2df-2251848e89df",
  "de4068fd-c8c8-4779-9f3b-03c49acd0013",
  "9fc72471-5830-42a7-84a2-91ebf6a94541",
  "b81561eb-dccb-4254-86c4-0a6902734a40",
  "baee59d3-56cd-4bc2-8b7a-580e9c9002aa",
  "68947a31-6ea7-4e59-a5cb-a66932636ebc",
  "a70f9167-b2ab-4029-b7cf-1a4b5e1ca345",
  "3d2530d8-9965-4824-ba55-6505524e7444",
  "7beeec58-b4f0-4c54-bcbb-2149d2fd1152",
  "1509822f-173c-4d07-9293-73c5f1b63353",
  "c8ebe685-ca82-4add-b593-a57e3af11d3e",
  "e7298d0d-25fc-40a3-80cf-0a2e4334ab22",
  "319c392e-ff69-467f-bfd2-3c20094c1290",
  "36b0a84e-e1a6-41c4-a86b-ca75a85051c6",
  "babff97f-43f0-4b82-8a21-86543a558e04",
  "112312aa-b1d6-4691-aee5-0b46ddf0217f",
  "c455d71f-3f06-40fc-bd32-80515dbf54cd",
  "5e267062-baa1-49d6-88d3-ac00387ca952",
  "c81b2eb8-afa8-463e-a4c4-39355c032a02",
  "682eec25-28dc-41d8-929d-1937cb376fe2",
  "f12b107a-c8a5-4dc6-b8bc-38dd888e93dc",
  "6c6d8e85-7ba5-4e49-bff8-0ede74d8185a",
  "829675c4-52c2-4d16-8851-8c50c99f973c",
  "fead76cc-5ab7-42e6-8e49-abcb6d4a837a",
  "9835c2c1-b80a-4036-8aa1-7ecab25a8a72",
  "7eb5f7a4-9e07-4854-8490-903d5ef60181",
  "0d65fd32-af14-4c26-a1d7-2cf91c21e7b5",
  "f3d570d1-4d73-4bd9-a672-36d4ad82e201",
  "a6d73529-4b0a-4ebb-9f68-a840dce23bf4",
  "869b4c29-c181-41fb-b911-636c040c7c5a",
  "7bf738d3-8382-475e-a5a6-2c81ca3b7123",
  "1aa4b1c5-807d-49df-b703-63b3bf5a8d15",
  "d9c544b7-cbf9-4691-9dbb-cf1523611e05",
  "ee4261ba-80c8-4d1e-b67c-9c082f3d0eb3",
  "30c62481-9c92-4182-8c65-d31d79808f2c",
  "a8c48357-9239-4557-b291-5e00f7db084d",
  "a7dd94c7-c7a5-4674-9790-a659ece7c77c",
  "f26863a7-9ab7-4d5a-9a2d-105a6010b470",
  "ea03d185-c4e8-484b-a34a-7459599a0ab5",
  "01428edc-fb21-488b-a2a5-283fee95300e",
  "49f2707c-a233-4f10-bbea-ed49645c6603",
  "59819417-69e1-4f48-be33-b8287565e865",
  "ce6ddeae-5ccf-493e-aacb-cb959f0bb359",
  "c40654ca-d96c-4eba-ae3e-cb0680607797",
  "6c0b8f18-8f85-4a14-87a1-ae14f09d8c51",
  "c2b0978e-4cc4-4748-972a-b9d6c2ef09cd",
  "c47a95de-fed8-4b4f-ac07-0421e2b7b37c",
  "7b096548-e104-4829-8e00-ab71cf343f0e",
  "f925eb67-da4d-46d3-94b3-7e2447ec876b",
  "0e62125f-d40a-48b6-822b-7a2921cc0e73",
  "239ccfd7-6f7c-4105-af1c-098bb08b95c7",
  "c57456c2-e7d5-4ac1-96c1-9b7f90b4ffc7",
  "46523e56-713a-4d51-8216-0c6f97ba4402",
  "5868e6ca-f533-4eca-88d4-d16168ac8f0c",
  "2d67d1fb-2a29-4aff-bbf0-7cdcbb2b9f11",
  "a3b2b65b-1d68-43c2-973d-95559fa14df7",
  "291ac64e-721b-49a7-96ed-e7b4c02d5daa",
  "867826af-4b97-46d7-acd4-0212b95ce26d",
  "123f27bb-53f1-446d-9abe-48ae4f6e851a",
  "4e3690cf-1268-4c7d-88f9-d28bd3a444c0",
  "98bf45a5-7660-472e-b9d9-fd98639f39bd",
  "9c9e34c0-747f-49e8-86b9-a5f54dcbd479",
  "91db7847-7599-4b3f-a55b-47b511ebadce",
  "fe71098d-7caa-41e6-9a14-b8ac17db5083",
  "9c0707d6-4611-43e2-9879-0e3fc685804e",
  "4a1b86bc-14d7-4a8a-b56a-92bba0463562",
  "6d033c66-6426-489d-8620-fb3c066febf1",
  "47dbca1b-2d23-4f2a-8f6f-0cf57770bca8",
  "2cdd182d-6d2a-4cfb-9944-bb3bdeaa8669",
  "433eb689-9242-4851-8c7b-d36548c53712",
  "34d8244f-4f17-495d-8ec7-b5bce1386a50",
  "240d11fb-1c0b-4c13-9091-91bc08bb1039",
  "aba81f86-ec1c-4bac-96ef-94b660b99a25",
  "cfbdffc4-c68f-4a03-acf8-2d03f8c4156f",
  "a856ec59-d6ff-4179-8d16-7735ec5f0a6d",
  "d402ac89-6207-4eab-a4b9-1aacf07b07b9",
  "0022440d-712d-4b2f-a454-deaf609d3476",
  "d45c4f57-9c06-43e3-b8bb-3aeb51350fae",
  "c6957d50-c8ef-4595-a66e-b7399e7d5c75",
  "b6dca805-bf20-43a1-a311-87ea507e060d",
  "9533ec7c-a595-44ec-a60e-0adf5efced71",
  "982ff67f-f6ca-4cf5-8532-74e991129b81",
  "de42defb-64d1-495a-a841-d08ec0de4809",
  "fff8aaeb-0194-49c2-bd98-5cbdfb8aea07",
  "53159d8a-fce9-47c3-9d73-57414f7e5040",
  "cbebc754-202b-4a91-a131-429a2c261384",
  "84e4d003-459e-425a-a5bd-e263996f1306",
  "68931a7a-7ad2-4a18-9027-34c22980f0de"
]
homeListings['horror'] =[
  "5e3c37de-9c91-454e-a6b9-98fc5b726525",
  "3e4b00d0-0f43-4c01-b542-f2cb8978ce38",
  "8b1ac9a5-82d5-4789-b818-c6771dfdaca1",
  "54d961fb-49d3-4190-98e6-480877f049d9",
  "80eda96b-2646-4a41-8598-c8eaca372fc2",
  "a058ea78-e0aa-4cc6-ad6a-4535fff0bb7d",
  "1f0639b0-ea39-42b3-9d0a-8d171dcad1a7",
  "7f9f358f-f9a7-428a-a22e-6dd061d6fcae",
  "d845b3f8-78d0-4bce-b587-2749dfb4e01c",
  "6313bedf-901c-406a-bea9-4cc9aa485df9",
  "dd043963-9a6b-4299-9ba5-35aea573ca77",
  "bc876803-7e34-421d-ae0f-837b18b6d4a2",
  "e7d6cd87-1e6f-49b2-a890-1998e058d6eb",
  "1ae317c5-f508-4d14-8041-71664e19d390",
  "7a4ee249-237d-4275-bc2b-ce033f5808d0",
  "436285e2-ac4d-4dfa-ad5e-25cdeb85d18f",
  "a3b4aa2d-6a7e-442e-bae7-744a28d2bc15",
  "3b074e75-3dbc-42ba-b014-ec5140b1f0ad",
  "a8102949-c327-4f9a-9c98-9c9a264314d0",
  "c1ea9c03-7201-4d0d-8237-16f98e7503bf",
  "a688a2b7-a197-4378-8540-e1bfcc9e96c5",
  "f05709fa-9e1d-42bf-8cbb-26e7ac3b6f82",
  "b6036d91-9235-4d95-b255-0a4295f4d6e9",
  "0da7caee-8961-4ab2-b816-b176637d3448",
  "305c1a9a-efb6-4fe5-82c5-12799920a5d0",
  "ebe3bb75-5e9d-49a6-9579-ef3e19957b3c",
  "e353c6cb-4aa9-4c7a-8bff-a3ed0a0419a1",
  "7bf4df50-ef05-4fcd-af3e-04ca872ca7a4",
  "1faf3c65-bab1-494a-973f-c9dba3d89eee",
  "d293506f-1740-499c-a15e-de26fade530c",
  "1e940b08-888a-4734-bb58-8764408cda91",
  "c0a5e857-9e66-44e9-8f40-f69726ab714d",
  "590b71c1-b556-4152-a6f8-3a8b2476e207",
  "989a5e4b-acf3-4937-9ab9-bf566dd01d90",
  "48d856c9-7c35-4d53-b2b8-90c88afb0ff7",
  "b8dc7b2d-3914-44df-84fa-d9dd5896e8c7",
  "53b4c4ae-bbe4-4f92-a62d-6db95025c79a",
  "7fa9fa5f-f77c-4b61-aca0-5e0d16d6d9f0",
  "e467a9b4-1c9c-401b-abf5-847952ac6cb4",
  "1506a417-add6-49ac-80f1-27efb7dbdb34",
  "3c5a4531-b1cd-40b6-b8ce-91a3ac1672cf",
  "c935e8b1-a877-47a6-a272-a111d07abdc2",
  "8ff66803-e3c8-4790-9b3a-63ca661d08cb",
  // "a4863478-f69f-42b9-97bb-83ea7bd7261a",
  "0d454195-a13a-482b-b3cc-3ca8838df998",
  "e7a46414-939b-4ff7-a9c0-a0bcc0532218",
  "8fbfd5d9-332c-44d7-bbec-709bf8d92353",
  "57530e0c-cd61-4d66-83bc-81d362eda8a9",
  "50cf05f6-3f30-4e1e-af9f-9f1f4c6048cd",
  "aa1cf7a2-01c2-4b39-8801-85df93f5d7fc",
  "58d6c5b2-f72a-42ec-b4c4-780aad68d59f",
  "ba502b46-1eec-44e7-8d23-9e65eac13890",
  "3211b345-3506-4f56-835e-48ff831d6c91",
  "e724a103-7cfe-42d7-a878-272f02746578",
  "22b0b93c-fe96-40b9-9c95-b441e0f2069c",
  "f58e3252-8427-4068-bd2d-62b2f82be243",
  "9ef0392b-7113-4304-96a0-c4382b285aae",
  "f52cff6b-7b1a-4bfa-ae5a-19107c069873",
  "11305682-646a-41bf-b30b-1c5dac086086",
  "0226ad0e-d776-413b-9c86-74d6a667fe1d",
  "388b9567-9045-4659-b4ac-866e860b0e4a",
  "da9a18f6-043e-415f-96aa-1788af3ca547",
  "9186dd67-c516-4fcc-9e5f-c4729eb45081",
  "1c1810d1-c921-43fb-a690-b53d6604a83e",
  "66714ef5-725d-4a1e-b384-1b0e57a8dd5d",
  "fcad8e69-7c76-4e34-a2bd-c02d845e4a38",
  "4585724d-cdac-4ea8-ad2a-767cad9edbc7",
  "74eaeba0-9a32-4e38-bf14-f4159dc97a7b",
  "c665fd2d-3135-4a66-a66d-978af75315b3",
  "c9b56692-b337-410f-86ef-018338e3f0c9",
  "b73d3ce8-e947-480c-9d10-0988c2c6dd0f",
  "8fd113bb-8314-42f7-9b47-a334fac24f83",
  "16e93f4c-8b4b-4fa7-a441-455697fad608",
  "83c7781b-7152-4b8e-ad7f-0a6f6077037a",
  "5d0eb8cc-ace4-4e37-9113-50055a9de727",
  "832062b0-0cc5-4e09-a70e-1215e0f2a00f",
  "f0692c9e-3933-441f-9d7d-44708fac267d",
  "b42c48d3-3337-4645-844f-97c8d5865f39",
  "aaee81e5-8f06-4c52-8352-a7eb30744b61",
  "da08d502-ae7e-48cf-b885-dfe1b16005b7",
  "52be5932-e3a2-4725-9781-58feb93c967d",
  "1c1518e6-a8d5-4e34-a2ec-95268567911e",
  "9c9df825-e02b-4bc5-abcc-12044b14e2c6",
  "781c6a2c-63a1-45cb-881f-f405ab5881ea",
  "66388af8-9cd3-4640-86a8-85b69b98a7be",
  "886ab70f-c8e6-4631-be56-9859ef1794b8",
  "cd8082c0-b1dc-4621-bf6a-455cbdacd221",
  "2dd3685c-8f7a-4cfb-99aa-7c776786c6fb",
  "c7e9aa77-9260-429f-b78f-4ee4876ada3d",
  "014a5c67-2e73-4d20-8523-608dbe188ec4",
  "cfaa23bb-cd2a-495c-bf27-4d4ff714c308",
  "1c9e5451-e3b1-422d-9d26-3592f12f9e44",
  "b0097942-f505-4ba9-88eb-9477f2a5cb9a",
  "c5734360-8e8d-4dde-bb97-39216c1f6d1a",
  "d110eba9-f2f5-4a23-926d-25b163acf7e6",
  "3d635004-e352-4f4d-9871-9925edec6adf",
  "6509b3d4-e9db-47ec-952c-7dc65994791e",
  "027a9873-b616-4d64-838f-a4fad4704e52",
  "0843cb52-2b62-4e76-a309-1d6b5fa0f240",
  "3b07fb82-8ba0-4b29-ac26-a4ae58e699ac"
];

// *** Endpoints ***
router.get(`${BASE_URL_HOME}`, async (ctx) => {
  try {
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      homePage: homeListings
    }
  } catch (err) {
    ctx.status = 400;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    }
  }
});

router.get(`${BASE_URL_CONTENT}/:videoId`, async (ctx) => {
  try {
    console.log('videoId to CONTENT service GET:', ctx.params.videoId);
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: makeFakeContent(1, [ctx.params.videoId])[0]
    };
  } catch (err) {
    console.log('some error');
    ctx.status = 404;
    ctx.body = {
      status: 'error',
      message: err.message || 'Sorry, an error has occurred.'
    };
  }
});

// POST VIDEO CONTENT
var postIterationCount = 0
var postInterval = setInterval(() => {
  if(postIterationCount++ >= 1) {
    clearInterval(postInterval);
    return;
  }
  // post new videoId: 54d961fb-49d3-4190-98e6-480877f049d9
  axios.post(`${CFS_ADDRESS}${BASE_URL_CONTENT}`, makeFakeSnippet(1, ['54d961fb-49d3-4190-98e6-480877f049d9'])[0])
  .then(response => {
    // console.log('/content POST response:', response.data);
  })
  .catch(err => {
    console.error('/content POST error:', err);
  })
}, 500);

// POST TO HOME
setTimeout(() => {
  axios.post(`${CFS_ADDRESS}${BASE_URL_HOME}`, {
    homePage: homeListings
  })
  .then(response => {
    console.log('/home post response:', response.data.message);
  })
  .catch(err => {
    console.error('/home post error:', err);
  })
}, 1*1000);
// UPDATE CONTENT
setTimeout(() => {
  axios.patch(`${CFS_ADDRESS}${BASE_URL_CONTENT}`, {
    videoId: '54d961fb-49d3-4190-98e6-480877f049d9',
    regions: ['some region']
  })
  .then(response => {
    console.log('/content patch response:', response.data.message);
  })
  .catch(err => {
    console.error('/content patch error:', err);
  })
}, 5500)

// DELETE VIDEO
var deleteIterationCount = 0
var deleteInterval = setInterval(() => {
  if(deleteIterationCount++ >= 1) {
    clearInterval(deleteInterval);
    return;
  }
  axios.delete(`${CFS_ADDRESS}${BASE_URL_CONTENT}/54d961fb-49d3-4190-98e6-480877f049d9`)
  .then(response => {
    // delete from the home page posts
    var index = homeListings['horror'].indexOf('54d961fb-49d3-4190-98e6-480877f049d9');
    if(index !== -1) {
      homeListings['horror'].splice(index, 1);
    }
    console.log('/content DELETE response:', response.data);
  })
  .catch(err => {
    console.error('/content DELETE error:', err);
  })
}, 6*1000);

const makeFakeSnippet = (number, videoIds) => {
  var snippets = [];
  for(var i = 0; i < number; i++) {
    console.log('making fake snippet with videoIds[', i, ']:', videoIds[i]);
    snippets.push({
      videoId: videoIds[i],
      genres: [faker.random.word(), faker.random.word(), faker.random.word()],
      title: faker.random.words(),
      thumbnailURL: faker.image.imageUrl(),
      trailerURL: faker.image.imageUrl(),
      cast: [
        faker.name.firstName() + ' ' + faker.name.lastName(),
        faker.name.firstName() + ' ' + faker.name.lastName(),
        faker.name.firstName() + ' ' + faker.name.lastName()
      ],
      director: faker.name.firstName() + ' ' + faker.name.lastName(),
      regions: [faker.address.country(),faker.address.country(),faker.address.country()]
    });
  }
  return snippets;
}

const makeFakeContent = (number, videoIds) => {
  var videos = [];
  for(var i = 0; i < number; i++) {
    videos.push({
      videoId: videoIds[i],
      description: faker.random.words(30),
      genres: [faker.random.word(), faker.random.word(), faker.random.word()],
      title: faker.random.words(),
      thumbnailURL: faker.image.imageUrl(),
      trailerURL: faker.image.imageUrl(),
      cast: [
        faker.name.firstName() + ' ' + faker.name.lastName(),
        faker.name.firstName() + ' ' + faker.name.lastName(),
        faker.name.firstName() + ' ' + faker.name.lastName()
      ],
      director: faker.name.firstName() + ' ' + faker.name.lastName(),
      duration: Math.floor(Math.random() * 3*60*60),
      rating: ['G','PG','PG-13','R'][Math.floor(Math.random() * 4)%4],
      releaseDate: faker.date.past(),
      locationURI: faker.internet.url(),
      isOriginal: Boolean(Math.floor(Math.random() * 2)),
      isMovie: Boolean(Math.floor(Math.random() * 2)),
      regions: [faker.address.country(),faker.address.country(),faker.address.country()]
    });
  }
  return videos;
}

module.exports = router;