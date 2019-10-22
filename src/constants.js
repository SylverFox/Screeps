/** ROOM TYPES **/
global.ROOM_TYPE_UKNOWN = 0
global.ROOM_TYPE_MY_BASE = 1
global.ROOM_TYPE_HOSTILE_BASE = 2
global.ROOM_TYPE_MY_OUTPOST = 3
global.ROOM_TYPE_HOSTILE_OUTPOST = 4
global.ROOM_TYPE_EMPTY = 5
global.ROOM_TYPE_FARM = 6
global.ROOM_TYPE_SOURCE_KEEPERS = 7

/** EMOJI **/
global.EMOJI_SLEEPING = '😴'
global.EMOJI_TIRED = '😫'
global.EMOJI_CONFUSED = '😕'
global.EMOJI_FEARFUL = '😨'
global.EMOJI_HEAD_BANDAGE = '🤕'

/** DEFCON **/
global.DEFCON_1 = 1
global.DEFCON_2 = 2
global.DEFCON_3 = 3
global.DEFCON_4 = 4
global.DEFCON_5 = 5

/** BASE_NAME **/
global.BASE_NAME = [
  73, 769, 795, 785, 835, 777, 772, 770, 843, 785, 838, 798, 790, 846, 854, 819, 803, 800, 796,
  815, 803, 116, 779, 836, 789, 780, 836, 816, 853, 858, 790, 840, 821, 39, 850, 777, 848, 855,
  777, 778, 782, 796, 863, 814, 858, 845, 806, 839, 803, 800, 813, 824, 115, 865, 836, 832, 795,
  836, 863, 846, 857, 792, 813, 797, 815, 826, 811, 32, 67, 842, 776, 862, 861, 849, 788, 834,
  829, 780, 825, 825, 846, 812, 840, 845, 111, 859, 782, 865, 781, 838, 807, 828, 808, 818, 852,
  811, 800, 109, 787, 771, 784, 862, 836, 785, 862, 778, 862, 809, 817, 791, 812, 812, 846, 819,
  866, 105, 833, 859, 862, 774, 795, 842, 778, 780, 849, 810, 857, 817, 809, 793, 823, 110, 843,
  780, 782, 865, 770, 835, 859, 864, 838, 850, 840, 860, 853, 808, 840, 817, 854, 103, 784, 844,
  784, 850, 843, 785, 778, 789, 793, 811, 797, 815, 826, 837, 827, 796
].map(c => String.fromCharCode(c)).reduce((a, b) => a + b, '')

global.log = function (...msgs) {
  console.log(Game.time + ' -', msgs)
}