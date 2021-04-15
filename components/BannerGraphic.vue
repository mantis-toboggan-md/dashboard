<script>
import BrandImage from '@/components/BrandImage';
export default {
  components: { BrandImage },

  props:      {
    title: {
      type:    String,
      default: null,
    },
    titleKey: {
      type:    String,
      default: null,
    },

    small: {
      type:    Boolean,
      default: false
    }
  },
};
</script>

<template>
  <div class="banner-graphic" :class="{'small': small}">
    <div class="graphic">
      <BrandImage class="banner" file-name="banner.svg" />
    </div>
    <div v-if="titleKey" class="title">
      <t :k="titleKey" :raw="true" />
    </div>
    <h1 v-else-if="title" class="title">
      {{ title }}
    </h1>
  </div>
</template>

<style lang="scss">
  $banner-height: 240px;
  $banner-height-small: 200px;

  .banner-graphic {
    position: relative;

    .graphic {
      display: flex;
      flex-direction: column;
      height: $banner-height;
      overflow: hidden;
      > img.banner {
        object-fit: cover;
        width: 100%;
        height: $banner-height;
      }
    }
    .title {
      position: absolute;
      text-align: center;
      top: 70px;
      width: 100%;
    }
    &.small {
      .graphic {
        height: $banner-height-small;
        img.banner {
          margin-top: ($banner-height-small - $banner-height)/2;
        }
      }
      .title {
        top: 50px;
      }
    }
  }
</style>
