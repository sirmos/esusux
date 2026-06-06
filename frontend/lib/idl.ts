export const IDL = {
  version: "0.1.0",
  name: "esusux",
  instructions: [
    {
      name: "createCircle",
      accounts: [
        { name: "circle", isMut: true, isSigner: false },
        { name: "organizer", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "contributionAmount", type: "u64" },
        { name: "maxMembers", type: "u8" },
        { name: "intervalDays", type: "u8" },
      ],
    },
    {
      name: "joinCircle",
      accounts: [
        { name: "circle", isMut: true, isSigner: false },
        { name: "memberList", isMut: true, isSigner: false },
        { name: "member", isMut: true, isSigner: true },
        { name: "memberUsdcAccount", isMut: true, isSigner: false },
        { name: "circleVault", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "contributeAndDisburse",
      accounts: [
        { name: "circle", isMut: true, isSigner: false },
        { name: "memberList", isMut: true, isSigner: false },
        { name: "member", isMut: true, isSigner: true },
        { name: "memberUsdcAccount", isMut: true, isSigner: false },
        { name: "circleVault", isMut: true, isSigner: false },
        { name: "recipientUsdcAccount", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Circle",
      type: {
        kind: "struct",
        fields: [
          { name: "organizer", type: "publicKey" },
          { name: "contributionAmount", type: "u64" },
          { name: "maxMembers", type: "u8" },
          { name: "intervalDays", type: "u8" },
          { name: "memberCount", type: "u8" },
          { name: "currentRound", type: "u8" },
          { name: "isActive", type: "bool" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "MemberList",
      type: {
        kind: "struct",
        fields: [
          { name: "circle", type: "publicKey" },
          { name: "members", type: { vec: "publicKey" } },
          { name: "collateralAmounts", type: { vec: "u64" } },
          { name: "hasReceived", type: { vec: "bool" } },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "CircleFull", msg: "Circle is full" },
    { code: 6001, name: "CircleAlreadyStarted", msg: "Circle already started" },
    { name: "AlreadyMember", code: 6002, msg: "Already a member" },
    { code: 6003, name: "CircleNotActive", msg: "Circle not active" },
    { code: 6004, name: "AlreadyReceived", msg: "Already received payout" },
    { code: 6005, name: "MathOverflow", msg: "Math overflow" },
  ],
} as const;

export type EsusuxIDL = typeof IDL;