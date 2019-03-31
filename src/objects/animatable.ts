export abstract class Animatable extends Phaser.GameObjects.Sprite {
  protected abstract buildAnimationKey(key: string);

  protected loadAnimation(
    key: string,
    config: object,
    onComplete: Function = null
  ) {
    const animationKey = this.buildAnimationKey(key);
    if (!this.scene.anims.get(animationKey)) {
      this.scene.anims.create({
        frameRate: 4,
        repeat: -1,
        ...config,
        key: animationKey
      });
      if (onComplete) {
        this.on(
            "animationcomplete",
            (animation, frame) => {
              if (animation.key === animationKey) {
                onComplete(animation, frame);
              }
            },
            this
        );
      }
    }
  }

  protected playAnimation(key: string) {
    this.play(this.buildAnimationKey(key));
  }
}
