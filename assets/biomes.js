/* The Void — biome tables for surface worlds. Colour arrays run dark -> light. Decor entries: [kind, perHundredPx, depthLayer(0 back/1 front), underwaterOnly] */
(function () {
  'use strict';
  var V = window.VOID, B = V.biomes = {}, T = V.themes = {};
  var SOIL_BROWN = ['#2a1c16', '#4a3024', '#6c4a34', '#8e6646'];
  var LEAF_G = ['#1f4a2a', '#2f7a3a', '#52a844', '#9ad65a'], TRUNK = ['#2a1a12', '#4a3022', '#6c4a30', '#8e6646'], ROCK = ['#3a3a4a', '#5e5e70', '#8a8a9c', '#b8b8c8'];
  function bio(id, o) {
    var d = { id: id, top: LEAF_G, soil: SOIL_BROWN, topT: 4, amp: 8, rough: .5, base: 10, ridge: 0, dune: 0, hump: 0, b1: null, decor: [], critters: [], pal: {}, far: ['#a8c0d8', '#88a8b8', '#5a8a78'], haze: '#9ab4d0', weather: null, shape: null, liquid: null, glow: 0, craters: 0, nightTint: 1 };
    for (var k in o) d[k] = o[k];
    d.pal = Object.assign({ leaf: LEAF_G, trunk: TRUNK, grass: LEAF_G.slice(1), rock: ROCK, stone: ['#3a3548', '#6a6478', '#a49cb4', '#d4cce0'] }, o.pal || {});
    B[id] = d; return d;
  }
  bio('meadow', { top: ['#2a5a2e', '#3f8a3c', '#62b84a', '#a4e070'], amp: 9, rough: .5, base: 14, topT: 4, far: ['#aac8e0', '#86b0a8', '#5a9060'], haze: '#a8cce0',
    decor: [['tuft', 9, 1], ['flowers', 5, 1], ['oak', 1.1, 1], ['oak', .9, 0], ['bush', 1.4, 1], ['rock', .6, 1], ['smallmush', .5, 1]], weather: 'rain',
    critters: [['rabbit', 3], ['butterfly', 5], ['bird', 3], ['deer', .9]], pal: { fruit: '#e04a4a', berry: '#d84a8a' } });
  bio('forest', { top: ['#1a3a22', '#2a6030', '#3f8a3c', '#6cb050'], amp: 12, rough: .6, base: 18, topT: 5, far: ['#7a9ab0', '#4a7a6a', '#2a5a48'], haze: '#7a9ab0',
    decor: [['pine', 3.4, 1], ['pine', 3, 0], ['oak', 1.3, 1], ['fern', 4, 1], ['smallmush', 2, 1], ['tuft', 4, 1], ['rock', .8, 1], ['bush', 1.4, 1]], weather: 'rain',
    critters: [['deer', 1.8], ['fox', 1.4], ['bird', 4], ['firefly', 10]], pal: { leaf: ['#12301c', '#1f5a2c', '#2f8038', '#58a84a'], grass: ['#1f5a2c', '#2f8038', '#58a84a'] } });
  bio('mountains', { top: ['#4a4a5c', '#6e6e82', '#9a9ab0', '#d0d0e2'], soil: ['#2a2a38', '#4a4a5e', '#6e6e86', '#9090a6'], topT: 2, amp: 74, rough: .45, ridge: .85, base: 56, snow: 112, far: ['#b0bcd6', '#8a98b8', '#667896'], haze: '#a8b8d4',
    decor: [['rock', 2.6, 1], ['pine', 1, 1], ['pine', .8, 0], ['deadtree', .25, 1], ['icespike', .25, 1]], weather: 'snow', critters: [['goat', 2], ['eagle', 2]],
    pal: { leaf: ['#12301c', '#1f5a2c', '#2f8038', '#58a84a'], snow: ['#8aa0c8', '#c8d8f0', '#ffffff'] } });
  bio('tundra', { top: ['#9ab0d4', '#c8d8ee', '#e8f0fa', '#ffffff'], soil: ['#4a5a7e', '#6a7a9e', '#8a9ec0', '#b0c4dc'], topT: 5, amp: 9, rough: .4, base: 12, far: ['#dce8f8', '#b4cae6', '#8aa4c8'], haze: '#d0e0f4',
    decor: [['pine', 1.6, 1], ['pine', 1.2, 0], ['icespike', 1.6, 1], ['rock', .9, 1], ['deadtree', .3, 1]], weather: 'snow', aurora: true, critters: [['penguin', 3], ['fox', .8], ['bird', 1]],
    pal: { snow: ['#9ab0d8', '#d8e6f8', '#ffffff'], leaf: ['#16342a', '#24604a', '#3a8468', '#6aa88a'], rock: ['#5a6a8a', '#8a9ab8', '#c0d0e8', '#f0f6ff'] } });
  bio('ruins', { top: ['#4a5a3a', '#6a7a4a', '#8a9a5a', '#b0c070'], soil: ['#2a2630', '#4a4458', '#6a647a', '#8a849a'], topT: 3, amp: 6, rough: .6, base: 10, far: ['#9aa0bc', '#747a9a', '#545a7a'], haze: '#9aa4c4', skyline: 'ruin',
    decor: [['ruinTower', 1.1, 0], ['pillar', 1.5, 1], ['arch', .5, 1], ['wall', 1.2, 1], ['car', .6, 1], ['dish', .3, 1], ['tuft', 5, 1], ['bush', 1, 1], ['deadtree', .5, 1], ['oak', .3, 1]], weather: 'rain',
    critters: [['bird', 2], ['rabbit', 1], ['crow', 2]], pal: { moss: '#5a7a3a', concrete: ['#2a2838', '#4a4860', '#6a6882', '#8a88a2'], rust: 1 } });
  bio('desert', { top: ['#a8683a', '#d09050', '#ecb870', '#ffe0a0'], soil: ['#6a3a22', '#945a34', '#bc7e4a', '#dca468'], topT: 9, amp: 5, rough: .3, base: 10, dune: 15, far: ['#f0cfa8', '#dca880', '#b88060'], haze: '#f0d4b0', skyline: 'mesa',
    decor: [['cactus', 1.3, 1], ['rock', 1, 1], ['bones', .28, 1], ['deadtree', .3, 1], ['tuft', 1, 1]], weather: 'dust', critters: [['camel', .6], ['lizard', 2], ['vulture', 1]],
    pal: { leaf: ['#1f4a2a', '#2f7a3a', '#56a84a', '#9ad65a'], rock: ['#5a3a2a', '#8a5a3a', '#bc8a5a', '#e0b888'], grass: ['#8a7a3a', '#b8a050', '#dcc878'], flower: '#ff6a8a' } });
  bio('city', { top: ['#2a2a3e', '#3e3e58', '#58587a', '#7a7aa0'], soil: ['#14142a', '#222240', '#303056', '#40406a'], topT: 3, amp: 2, rough: 0, base: 8, far: ['#6a7aa8', '#4a5a88', '#343e6a'], haze: '#6a7aa8', skyline: 'city', lights: 1,
    decor: [['lamp', 2.4, 1], ['building', 1.5, 0], ['car', .8, 1], ['tuft', .3, 1]], critters: [['drone', 3], ['bird', 1]], weather: 'rain', nightTint: .75,
    pal: { concrete: ['#1a1a30', '#2a2a48', '#3a3a5e', '#5a5a80'], neon: ['#ff3ac0', '#3ae0ff', '#ffe03a', '#7aff5a'] } });
  bio('shore', { top: ['#c8a468', '#e8c888', '#f8e0a8', '#fff4d0'], soil: ['#8a6a3a', '#a88850', '#c8a868', '#e0c488'], topT: 9, amp: 3, rough: .2, base: 6, b1: -60, far: ['#b8dcf0', '#8ac0e0', '#5a98c8'], haze: '#b0d8f0', skyline: 'sea',
    decor: [['palm', 1.8, 1], ['palm', 1.2, 0], ['rock', 1, 1], ['tuft', .5, 1], ['bush', .4, 1], ['boat', .2, 1]], critters: [['crab', 3], ['seagull', 3]], weather: 'rain',
    pal: { leaf: ['#1f5a2a', '#2f8a38', '#58b848', '#a0e068'], trunk: ['#4a3020', '#7a5a38', '#a88050', '#d0a870'], rock: ['#5a5a6a', '#8a8a9c', '#b8b8c8', '#e0e0ec'], grass: ['#8a8a3a', '#b8b850', '#dce078'] } });
  bio('sea', { top: ['#2a4a5a', '#4a7a8a', '#7aaab0', '#c0e0d8'], soil: ['#18303e', '#285060', '#3a7080', '#5a9098'], topT: 6, amp: 6, rough: .4, base: -62, far: ['#b8dcf0', '#8ac0e0', '#5a98c8'], haze: '#b0d8f0', skyline: 'sea', water: 1,
    decor: [['kelp', 4, 1, 1], ['rock', 1.4, 1, 1], ['coral', 1.8, 1, 1], ['palm', 0, 1]], critters: [['fish', 9], ['jellyfish', 3], ['whale', .5], ['seagull', 1]],
    pal: { leaf: ['#0e4a3a', '#1a8a5a', '#40c880', '#90f0b0'], crystal: ['#7a1a4a', '#d84a8a', '#ff8ab8', '#ffd0e0'], rock: ['#2a4a5a', '#4a7a8a', '#7aaab0', '#a8d0d0'] } });
  bio('isle', { top: ['#c8a468', '#e8c888', '#f8e0a8', '#fff4d0'], soil: ['#8a6a3a', '#a88850', '#c8a868', '#e0c488'], topT: 9, amp: 3, rough: .3, base: -62, hump: 86, far: ['#b8dcf0', '#8ac0e0', '#5a98c8'], haze: '#b0d8f0', skyline: 'sea',
    decor: [['palm', 2.2, 1], ['rock', 1, 1], ['tuft', 1, 1], ['bush', .6, 1], ['kelp', 3, 1, 1], ['coral', 2, 1, 1]], critters: [['crab', 4], ['seagull', 3], ['fish', 5]], weather: 'rain', B: 'shore',
    pal: { leaf: ['#1f5a2a', '#2f8a38', '#58b848', '#a0e068'], trunk: ['#4a3020', '#7a5a38', '#a88050', '#d0a870'], rock: ['#5a5a6a', '#8a8a9c', '#b8b8c8', '#e0e0ec'], grass: ['#8a8a3a', '#b8b850', '#dce078'], crystal: ['#7a1a4a', '#d84a8a', '#ff8ab8', '#ffd0e0'] } });
  B.shoreR = Object.assign({}, B.shore, { id: 'shoreR', base: -60, b1: 6 });
  B.beachA = B.shore;
  /* ---- generic worlds ---- */
  bio('jungle', { top: ['#14402a', '#1f7a3a', '#3ab050', '#8ae070'], soil: ['#241810', '#44301e', '#64482e', '#846842'], amp: 14, rough: .6, base: 16, topT: 5, far: ['#7ab0a0', '#3a8a70', '#1f6a50'], haze: '#6aa898',
    decor: [['jtree', 1.5, 1], ['jtree', 1.2, 0], ['fern', 6, 1], ['bush', 2, 1], ['flowers', 3, 1], ['tuft', 3, 1], ['alienplant', .5, 1]], weather: 'rain', critters: [['butterfly', 7], ['parrot', 4], ['beetle', 2]],
    pal: { leaf: ['#0e3a24', '#1a6a38', '#2ea04a', '#70d870'], grass: ['#1a6a38', '#2ea04a', '#70d870'], flowers: ['#ff5ab8', '#ffe03a', '#ff8a30', '#8a5aff'], alien: ['#0a4a4a', '#1aa8a0', '#8affe8'], bulb: '#b8fff0' } });
  bio('swamp', { top: ['#243a2a', '#3a5a3a', '#587a48', '#88a860'], soil: ['#1a1a14', '#2e2a1c', '#4a4228', '#6a5e38'], amp: 10, rough: .7, base: 3, topT: 4, water: 1, liquid: 'swamp', far: ['#8aa090', '#587a68', '#3a5a4a'], haze: '#7a9080',
    decor: [['deadtree', 1.6, 1], ['fungus', 1, 1], ['fern', 3, 1], ['smallmush', 3, 1], ['tuft', 2, 1]], critters: [['firefly', 12], ['beetle', 2], ['bird', 1]], weather: 'rain',
    pal: { cap: ['#3a1a5a', '#7a3aa8', '#b870e0', '#f0b8ff'], trunk: ['#1a1410', '#3a3020', '#5a4a30', '#7a6a44'], leaf: ['#1a3a22', '#2a5a30', '#4a8040', '#78a858'] } });
  function dunes(id, top, soil, far, haze, rock) { bio(id, { top: top, soil: soil, topT: 9, amp: 6, rough: .3, base: 10, dune: 16, far: far, haze: haze, skyline: 'mesa', decor: [['rock', 1.8, 1], ['deadtree', .3, 1], ['bones', .2, 1], ['cactus', .35, 1]], weather: 'dust', critters: [['lizard', 2], ['vulture', 1]], pal: { rock: rock, leaf: ['#3a3a2a', '#5a5a3a', '#8a8a50', '#b8b878'] } }); }
  dunes('dunesA', ['#a8683a', '#d09050', '#ecb870', '#ffe0a0'], ['#6a3a22', '#945a34', '#bc7e4a', '#dca468'], ['#f0cfa8', '#dca880', '#b88060'], '#f0d4b0', ['#5a3a2a', '#8a5a3a', '#bc8a5a', '#e0b888']);
  dunes('dunesB', ['#6a2a1a', '#a04a2a', '#d07040', '#f0a068'], ['#3a1810', '#5a2a1c', '#7a3a26', '#a05a3a'], ['#e8a890', '#c07860', '#8a5040'], '#e8b8a0', ['#4a2018', '#7a3a28', '#a85a3a', '#d08a62']);
  dunes('dunesC', ['#b8a888', '#d8cca8', '#ece4c8', '#fffbe8'], ['#6a6048', '#8a8060', '#aaa078', '#cac098'], ['#f0ead8', '#d8d0b8', '#b8b090'], '#f0ead0', ['#6a6050', '#9a9078', '#c8bea0', '#ece4c8']);
  bio('badlands', { top: ['#7a3a22', '#a85a34', '#d08050', '#f0a870'], soil: ['#4a2216', '#6a3220', '#8a4a30', '#aa6644'], topT: 3, amp: 46, rough: .5, ridge: .5, base: 40, far: ['#e8b090', '#c08060', '#905a44'], haze: '#e0b898', skyline: 'mesa',
    decor: [['rock', 3, 1], ['cactus', .4, 1], ['bones', .15, 1], ['deadtree', .3, 1]], weather: 'dust', critters: [['lizard', 2], ['vulture', 1]], pal: { rock: ['#4a2216', '#7a3a26', '#a85a3a', '#d08a62'] } });
  bio('moonplain', { top: ['#3a3a46', '#5a5a6a', '#8a8a9c', '#b8b8cc'], soil: ['#1e1e28', '#323240', '#4a4a5a', '#64647a'], topT: 2, amp: 7, rough: .5, base: 10, craters: 5, far: ['#6a6a7e', '#50505e', '#38384a'], haze: '#6a6a7e', skyline: 'moon',
    decor: [['rock', 3.2, 1], ['rock', 2, 0], ['metal', .1, 1]], critters: [], pal: { rock: ['#2a2a36', '#4a4a5a', '#7a7a8e', '#a8a8bc'] } });
  bio('craters', { top: ['#3a3640', '#5a5664', '#8a8696', '#b8b4c6'], soil: ['#1e1a24', '#322e3c', '#4a4658', '#645e78'], topT: 2, amp: 14, rough: .6, base: 14, craters: 10, far: ['#6a667a', '#504c5e', '#38344a'], haze: '#6a667a', skyline: 'moon',
    decor: [['rock', 3.8, 1], ['rock', 2, 0]], critters: [], pal: { rock: ['#2a2632', '#4a4658', '#7a768a', '#a8a4b8'] } });
  bio('iceplain', { top: ['#a8c8ec', '#d0e8ff', '#f0f8ff', '#ffffff'], soil: ['#4a70a0', '#6a98cc', '#98c0e8', '#c8e0f8'], topT: 4, amp: 10, rough: .4, base: 12, far: ['#d8eaff', '#b0ceee', '#88aad8'], haze: '#cce0f8', skyline: 'ice',
    decor: [['icespike', 3, 1], ['icespike', 2, 0], ['rock', 1, 1]], weather: 'snow', aurora: true, critters: [['penguin', 1.5]], pal: { rock: ['#4a70a0', '#7aa8d8', '#b0d4f4', '#f0f8ff'], ice: ['#3a6aa0', '#7ab8e8', '#c8ecff', '#ffffff'] } });
  bio('glacier', { top: ['#98bce4', '#c0dcfc', '#e8f4ff', '#ffffff'], soil: ['#3a609a', '#5a88c4', '#88b0e0', '#b8d4f4'], topT: 3, amp: 52, rough: .5, ridge: .7, base: 40, far: ['#d8eaff', '#b0ceee', '#88aad8'], haze: '#cce0f8', skyline: 'ice',
    decor: [['icespike', 4, 1], ['icespike', 2, 0], ['rock', 1, 1]], weather: 'snow', aurora: true, critters: [], pal: { ice: ['#3a6aa0', '#7ab8e8', '#c8ecff', '#ffffff'], rock: ['#4a70a0', '#7aa8d8', '#b0d4f4', '#f0f8ff'] } });
  bio('ashcraters', { top: ['#2a1412', '#4a2620', '#6a3a30', '#8a5446'], soil: ['#140808', '#261210', '#3a1c18', '#522a22'], topT: 2, amp: 14, rough: .6, base: 14, craters: 10, far: ['#6a2e20', '#4c1e14', '#2e100a'], haze: '#8a3a22', skyline: 'moon', weather: 'ash',
    decor: [['rock', 3.8, 1], ['rock', 2, 0]], critters: [['ember', 2]], pal: { rock: ['#14080a', '#2a1214', '#4a2224', '#6a3434'] } });
  bio('lavafield', { top: ['#1a0c0c', '#2c1412', '#4a2018', '#7a3626'], soil: ['#0e0606', '#1c0c0a', '#2c1210', '#4a1c14'], topT: 3, amp: 24, rough: .7, base: 12, water: 1, liquid: 'lava', far: ['#6a2a1a', '#4a1a10', '#2a0e08'], haze: '#8a3a22', skyline: 'volc', glow: 1, nightTint: .3,
    decor: [['vent', 2.4, 1], ['rock', 3, 1], ['rock', 2, 0]], weather: 'ash', critters: [['ember', 4]], pal: { rock: ['#14080a', '#2a1214', '#4a2224', '#6a3434'] } });
  bio('crystalField', { top: ['#2a1a5a', '#4a3a9a', '#7a6ae0', '#b8acff'], soil: ['#140a30', '#241450', '#382270', '#503290'], topT: 4, amp: 12, rough: .5, base: 12, far: ['#8a78d8', '#5a48b0', '#3a2a84'], haze: '#7a68c8', skyline: 'crystal', glow: 1,
    decor: [['crystal', 3.4, 1], ['crystal', 2, 0], ['rock', .5, 1], ['alienplant', 1, 1]], weather: 'spores', critters: [['orb', 6], ['jellyfish', 1]], nightTint: .55, pal: { rock: ['#1e1450', '#3a2a84', '#6a58c0', '#a090f0'], alien: ['#1a2a6a', '#4a6ae0', '#a0c0ff'], bulb: '#c8d8ff' } });
  bio('crystalForest', { top: ['#1a3a4a', '#2a6a7a', '#4aa0b0', '#9ae0e0'], soil: ['#0a1e30', '#143a50', '#225a74', '#34809a'], topT: 4, amp: 10, rough: .5, base: 12, far: ['#78c8d8', '#4898b0', '#2a6a88'], haze: '#68b8c8', skyline: 'crystal', glow: 1,
    decor: [['crystal', 3, 1], ['crystal', 2, 0], ['alienplant', 1.6, 1], ['fungus', .5, 1]], weather: 'spores', critters: [['orb', 6], ['moth', 3]], nightTint: .55, pal: { crystal: ['#0a4a6a', '#1aa0c8', '#7ae0f0', '#e0ffff'], alien: ['#0a3a5a', '#1a90b0', '#7affe8'], bulb: '#c0fff4', cap: ['#1a4a6a', '#2a90b0', '#70d8e8', '#c8ffff'] } });
  bio('fungal', { top: ['#2a1a3a', '#4a2a6a', '#7a4a9a', '#b078c8'], soil: ['#140a22', '#241238', '#381c52', '#522a74'], topT: 4, amp: 10, rough: .6, base: 14, far: ['#9a70c0', '#6a4894', '#40286a'], haze: '#8a60b0', glow: 1,
    decor: [['fungus', 2.6, 1], ['fungus', 1.6, 0], ['smallmush', 4, 1], ['alienplant', 1.4, 1], ['stalk', 1, 1]], weather: 'spores', critters: [['orb', 6], ['moth', 3], ['beetle', 2]], nightTint: .6, pal: { alien: ['#4a1a6a', '#b04ae0', '#ff8aff'], bulb: '#ffb8ff' } });
  bio('alienGarden', { top: ['#1a3a3a', '#2a7a6a', '#40b890', '#90f0c0'], soil: ['#0e2024', '#1a3a40', '#2a5a64', '#3a7a84'], topT: 4, amp: 10, rough: .5, base: 14, far: ['#78d0c0', '#48a090', '#2a7068'], haze: '#68c0b0', glow: 1,
    decor: [['alienplant', 3, 1], ['alienplant', 1.8, 0], ['stalk', 1.5, 1], ['fern', 3, 1], ['fungus', .6, 1]], weather: 'spores', critters: [['orb', 5], ['moth', 3], ['strider', 1]], nightTint: .6, pal: { alien: ['#0a3a4a', '#1aa890', '#8affc8'], bulb: '#c8fff0', leaf: ['#0e3a3a', '#1a7a6a', '#30b890', '#78f0b8'] } });
  bio('cloudDeck', { top: ['#b0702a', '#e0a060', '#ffd098', '#fff0d8'], soil: ['#704018', '#a06028', '#d09048', '#f0b878'], topT: 8, amp: 8, rough: .3, base: 12, dune: 5, far: ['#e8b070', '#c88a48', '#a06a30'], haze: '#e8b878', skyline: 'cloud',
    decor: [['cloudpuff', 2.4, 1], ['cloudpuff', 1.6, 0]], critters: [['skyray', 1.5], ['orb', 2]], weather: null, flash: 1, pal: { cloud: ['#a06a3a', '#e0a060', '#ffd9a0', '#fff0d8'] } });
  bio('cloudDeckB', { top: ['#3a6aa8', '#6a9ad8', '#a8ccf4', '#e8f4ff'], soil: ['#1a3a6a', '#2a58a0', '#4a82d0', '#7aaae8'], topT: 8, amp: 8, rough: .3, base: 12, dune: 5, far: ['#8ab4e8', '#5a88c8', '#3a68a8'], haze: '#8ab0e0', skyline: 'cloud',
    decor: [['cloudpuff', 2.4, 1], ['cloudpuff', 1.6, 0]], critters: [['skyray', 1.5], ['orb', 2]], weather: null, flash: 1, pal: { cloud: ['#3a6aa8', '#6a9ad8', '#b0d0f8', '#f0f8ff'] } });
  bio('venusHills', { top: ['#6a4a1a', '#a07a2a', '#d0a840', '#f0d878'], soil: ['#3a2a10', '#5a4018', '#7a5a24', '#9a7430'], topT: 4, amp: 22, rough: .6, base: 16, far: ['#d8b860', '#b08a38', '#7a5a22'], haze: '#d8b868', skyline: 'volc',
    decor: [['rock', 2.4, 1], ['vent', 1, 1], ['deadtree', .4, 1], ['rock', 1.5, 0]], weather: 'dust', critters: [['skyray', .6]], pal: { rock: ['#3a2a10', '#6a4c1c', '#a07a30', '#d0a850'] } });
  bio('metalDeck', { top: ['#2a2a3a', '#4a4a62', '#7a7a96', '#aaaac0'], soil: ['#12121e', '#1e1e30', '#2a2a42', '#3a3a58'], topT: 3, amp: 1, rough: 0, base: 10, far: ['#3a3a52', '#2a2a40', '#1a1a2c'], haze: '#2a2a42', skyline: 'girder',
    decor: [['metal', 3, 1], ['pillar', 1, 0], ['dish', .3, 1], ['lamp', .8, 1]], critters: [['drone', 1.5]], pal: { stone: ['#2a2a3a', '#4a4a62', '#7a7a96', '#aaaac0'] } });
  bio('ruinStone', { top: ['#3a3a4a', '#5a5a70', '#80809a', '#aaaac4'], soil: ['#1a1a28', '#2a2a40', '#3e3e5a', '#565678'], topT: 3, amp: 8, rough: .5, base: 10, far: ['#6a6a8a', '#4a4a6a', '#34344e'], haze: '#6a6a88', skyline: 'ruin',
    decor: [['pillar', 2.4, 1], ['arch', 1, 1], ['wall', 1.6, 1], ['rock', 1.6, 1], ['pillar', 1.5, 0]], critters: [['moth', 2]], pal: { moss: '#4a6a5a' } });
  bio('ringfloor', { top: ['#2a5a2e', '#3f8a3c', '#62b84a', '#a4e070'], amp: 5, rough: .4, base: 12, far: ['#aac8e0', '#86b0a8', '#5a9060'], haze: '#a8cce0', skyline: 'city',
    decor: [['tuft', 8, 1], ['flowers', 4, 1], ['oak', 1, 1], ['building', .8, 0], ['lamp', .8, 1], ['bush', 1, 1]], critters: [['rabbit', 2], ['bird', 3], ['drone', 2]], weather: null, pal: { fruit: '#e04a4a', concrete: ['#2a3a4a', '#4a6278', '#7a9ab4', '#b8d4e8'], neon: ['#3ae0ff', '#7aff5a', '#ffe03a'] } });

  /* ---- themes: which biome pool a body type uses; airless worlds get a black sky ---- */
  function th(o) { return o; }
  T.earth = th({ seq: [['meadow', 1000], ['forest', 1200], ['mountains', 1200], ['tundra', 900], ['ruins', 800], ['desert', 1200], ['city', 900], ['shore', 500], ['sea', 800], ['shoreR', 500]], sky: 'earth', liquid: 'water', wl: 0, day: 360 });
  T.ocean = th({ pool: ['isle', 'sea', 'isle', 'sea', 'sea'], sky: 'earth', liquid: 'water', wl: 0, day: 300 });
  T.jungle = th({ pool: ['jungle', 'jungle', 'swamp', 'meadow', 'forest'], sky: 'jungle', liquid: 'water', wl: 3, day: 280 });
  T.desert = th({ pool: ['dunesA', 'badlands', 'dunesA'], poolB: ['dunesB', 'badlands', 'dunesB'], poolC: ['dunesC', 'badlands', 'dunesC'], sky: 'desert', day: 320 });
  T.rocky = th({ pool: ['moonplain', 'craters', 'moonplain'], sky: 'none', airless: 1, day: 480, gk: .8 });
  T.moon = th({ pool: ['moonplain', 'craters', 'moonplain'], sky: 'none', airless: 1, day: 520, gk: .5 });
  T.ice = th({ pool: ['iceplain', 'glacier', 'tundra', 'iceplain'], sky: 'ice', day: 420 });
  T.lava = th({ pool: ['lavafield', 'lavafield', 'ashcraters'], sky: 'lava', liquid: 'lava', wl: 3, day: 400 });
  T.crystal = th({ pool: ['crystalField', 'crystalForest', 'crystalField'], sky: 'crystal', day: 340 });
  T.gas = th({ pool: ['cloudDeck'], sky: 'gas', day: 300, gk: 1.3 });
  T.icegas = th({ pool: ['cloudDeckB'], sky: 'gasB', day: 300, gk: 1.3 });
  T.venus = th({ pool: ['venusHills', 'badlands', 'venusHills'], sky: 'venus', day: 500, wl: -999 });
  T.asteroid = th({ pool: ['moonplain'], sky: 'none', airless: 1, day: 200, gk: .22, minW: 700, tiny: 1 });
  T.comet = th({ pool: ['iceplain'], sky: 'none', airless: 1, day: 200, gk: .22, minW: 700, tiny: 1, snowfall: 0 });
  T.ruins = th({ pool: ['ruinStone', 'moonplain', 'ruinStone'], sky: 'none', airless: 1, day: 300, gk: .5 });
  T.station = th({ pool: ['metalDeck'], sky: 'none', airless: 1, day: 240, gk: .6, minW: 900 });
  T.wreck = th({ pool: ['metalDeck'], sky: 'none', airless: 1, day: 240, gk: .6, minW: 900 });
  T.donut = th({ pool: ['meadow', 'fungal', 'shore', 'sea', 'jungle'], sky: 'earth', liquid: 'water', wl: 0, day: 300 });
  T.cube = th({ pool: ['meadow', 'forest', 'desert', 'tundra', 'mountains'], sky: 'earth', liquid: 'water', wl: 0, day: 300 });
  T.ringworld = th({ pool: ['ringfloor', 'forest', 'ringfloor', 'sea', 'meadow'], sky: 'earth', liquid: 'water', wl: 0, day: 300, ringarch: 1 });
  T.venusB = T.venus;
  /* sky palettes: day, dusk, night as [top, horizon] */
  V.skies = {
    earth: { day: ['#3a78d8', '#bfe6ff'], dusk: ['#4a3a8a', '#ffa060'], night: ['#04051a', '#1a1a4a'] },
    jungle: { day: ['#2a8a9a', '#d8ffd0'], dusk: ['#4a3a7a', '#ffb070'], night: ['#03101a', '#102a3a'] },
    mars: { day: ['#a8603a', '#e8b27c'], dusk: ['#5a3a4a', '#8aa8c8'], night: ['#0a0406', '#2a1416'] },
    desert: { day: ['#4a90d8', '#ffe4b8'], dusk: ['#5a3a7a', '#ff8850'], night: ['#050818', '#2a2040'] },
    ice: { day: ['#5a98e0', '#e8f6ff'], dusk: ['#5a4a9a', '#ffb0a0'], night: ['#040a22', '#1a2a5a'] },
    lava: { day: ['#2a0808', '#a83a12'], dusk: ['#2a0808', '#a83a12'], night: ['#120404', '#4a1608'] },
    crystal: { day: ['#4a2a8a', '#c8a8ff'], dusk: ['#5a2a8a', '#ff90d0'], night: ['#0a0422', '#2a1a5a'] },
    gas: { day: ['#c07a3a', '#ffe4a8'], dusk: ['#8a4a3a', '#ffb070'], night: ['#201008', '#5a3018'] },
    gasB: { day: ['#3a68c8', '#bfe0ff'], dusk: ['#4a4a9a', '#ffa0b0'], night: ['#040a20', '#18305a'] },
    venus: { day: ['#c8a050', '#ffe8a8'], dusk: ['#8a5a30', '#ffb868'], night: ['#1a1006', '#4a3412'] },
    none: { day: ['#010103', '#010103'], dusk: ['#010103', '#010103'], night: ['#010103', '#010103'] }
  };
})();
