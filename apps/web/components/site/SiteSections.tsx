import {
  BrokenCopyMachine,
  MicroManagingCeo,
  SleepingIntern,
} from "@/components/characters/CharacterArt";
import { InstallControl } from "@/components/InstallControl";
import { ReplayAnalytics } from "@/components/ReplayAnalytics";

const sectionLinks = [
  ["Play", "#play"],
  ["Characters", "#characters"],
  ["Replay", "#replays"],
  ["Challenge", "#challenge"],
  ["Install", "#install"],
] as const;

export function SiteSections() {
  return (
    <div className="site-sections">
      <nav aria-label="Explore Fire Your Coworkers" className="site-section-rail">
        <a className="site-section-rail__brand" href="#top">
          Fire Your Coworkers
        </a>
        <div className="site-section-rail__links">
          {sectionLinks.map(([label, href]) => (
            <a href={href} key={href}>
              {label}
            </a>
          ))}
        </div>
      </nav>

      <section
        aria-labelledby="character-world-title"
        className="site-section site-character-world"
        id="characters"
      >
        <div aria-hidden="true" className="site-paper site-paper--one" />
        <div aria-hidden="true" className="site-paper site-paper--two" />
        <header className="site-section-heading">
          <p className="site-kicker">Meet the office disasters</p>
          <h2 id="character-world-title">Every bad fit has a personality.</h2>
          <p>
            The elevator is small. The egos, equipment, and employment liabilities are not.
            Learn who bends, who blocks the doors, and who turns one move into an HR incident.
          </p>
        </header>

        <div className="site-character-lineup">
          <article className="site-character" id="sleeping-intern">
            <div aria-hidden="true" className="site-character__number">
              01
            </div>
            <figure className="site-character__art">
              <SleepingIntern className="site-character__svg site-character__svg--intern" />
              <figcaption>Occupies premium floor space while technically on the clock.</figcaption>
            </figure>
            <div className="site-character__copy">
              <p className="site-character__department">Unpaid horizontal specialist</p>
              <h3>The Sleeping Intern</h3>
              <p>
                Easy to slide. Hard to wake. The intern is a long, low puzzle piece that can
                rescue a crowded floor or create an immediate orientation violation.
              </p>
              <dl>
                <div>
                  <dt>Puzzle instinct</dt>
                  <dd>Find the lowest available surface</dd>
                </div>
                <div>
                  <dt>HR trigger</dt>
                  <dd>Improper employee orientation</dd>
                </div>
              </dl>
              <a className="site-text-link" href="#play">
                Put the intern to work <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>

          <article className="site-character site-character--reverse" id="micro-managing-ceo">
            <div aria-hidden="true" className="site-character__number">
              02
            </div>
            <figure className="site-character__art">
              <MicroManagingCeo className="site-character__svg site-character__svg--ceo" />
              <figcaption>Makes every problem wider without making the elevator larger.</figcaption>
            </figure>
            <div className="site-character__copy">
              <p className="site-character__department">Executive obstruction department</p>
              <h3>The Micro-Managing CEO</h3>
              <p>
                Arms out. Calendar full. Spatial awareness unavailable. The CEO dominates the
                middle of the grid and reacts badly to contact with staff, glass, or reality.
              </p>
              <dl>
                <div>
                  <dt>Puzzle instinct</dt>
                  <dd>Control the entire middle row</dd>
                </div>
                <div>
                  <dt>HR trigger</dt>
                  <dd>Unscheduled executive contact</dd>
                </div>
              </dl>
              <a className="site-text-link" href="#play">
                Schedule the mandatory meeting <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>

          <article className="site-character" id="broken-copy-machine">
            <div aria-hidden="true" className="site-character__number">
              03
            </div>
            <figure className="site-character__art">
              <BrokenCopyMachine className="site-character__svg site-character__svg--printer" />
              <figcaption>Rattles, jams, and produces paperwork faster than Legal can shred it.</figcaption>
            </figure>
            <div className="site-character__copy">
              <p className="site-character__department">Operational equipment concern</p>
              <h3>The Broken Copy Machine</h3>
              <p>
                Heavy, awkward, and always printing at the worst moment. The copier creates hard
                edges, airborne paper, and a compelling argument for remote work.
              </p>
              <dl>
                <div>
                  <dt>Puzzle instinct</dt>
                  <dd>Jam the useful corner</dd>
                </div>
                <div>
                  <dt>HR trigger</dt>
                  <dd>Unsafe equipment stacking</dd>
                </div>
              </dl>
              <a className="site-text-link" href="#play">
                Make one more copy <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>
        </div>
      </section>

      <section aria-labelledby="replay-title" className="site-section site-replay" id="replays">
        <ReplayAnalytics />
        <header className="site-section-heading site-section-heading--split">
          <div>
            <p className="site-kicker">Replay the poor decision</p>
            <h2 id="replay-title">Six seconds. Three mistakes. One perfect share.</h2>
          </div>
          <p>
            A replay preserves the move, the squish, and the exact moment HR loses patience. The
            same office disaster becomes a compact story someone else can try to solve.
          </p>
        </header>

        <div aria-label="Replay storyboard showing a copy machine colliding with the CEO and triggering HR" className="site-replay-strip" role="img">
          <div aria-hidden="true" className="site-replay-strip__perforation" />
          <div className="site-replay-frame">
            <span className="site-replay-frame__time">00:01</span>
            <BrokenCopyMachine className="site-replay-frame__printer" />
            <p>Drag the copier into the only available gap.</p>
          </div>
          <div className="site-replay-frame site-replay-frame--impact">
            <span className="site-replay-frame__time">00:03</span>
            <MicroManagingCeo className="site-replay-frame__ceo" />
            <BrokenCopyMachine className="site-replay-frame__printer" />
            <p>The CEO discovers compression.</p>
          </div>
          <div className="site-replay-frame site-replay-frame--warning">
            <span className="site-replay-frame__time">00:06</span>
            <strong>FORMAL WARNING</strong>
            <p>HR preserves the evidence for everyone.</p>
          </div>
          <div aria-hidden="true" className="site-replay-strip__playhead" />
        </div>

        <div className="site-replay-actions">
          <a className="site-primary-link" href="#play">
            Play the first floor
          </a>
          <a className="site-secondary-link" href="#characters">
            Meet the cast
          </a>
        </div>
      </section>

      <section aria-labelledby="challenge-title" className="site-section site-challenge" id="challenge">
        <div aria-hidden="true" className="site-challenge__stamp">
          YOUR MOVE
        </div>
        <div className="site-challenge__copy">
          <p className="site-kicker">Challenge the group chat</p>
          <h2 id="challenge-title">Send the exact bad decision.</h2>
          <p>
            Finish the floor, preserve the setup, and hand the same cramped elevator to someone
            who insists they could do better. No vague score bragging—just the puzzle that caused it.
          </p>
          <a className="site-primary-link site-primary-link--cream" href="#play">
            Take the Floor One challenge
          </a>
        </div>
        <ol className="site-challenge__steps">
          <li>
            <span>01</span>
            <strong>Pack it</strong>
            <p>Fit the office without giving HR a clean case.</p>
          </li>
          <li>
            <span>02</span>
            <strong>Preserve it</strong>
            <p>Keep the move sequence and the consequences together.</p>
          </li>
          <li>
            <span>03</span>
            <strong>Pass it on</strong>
            <p>Let someone else inherit the management problem.</p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="install-title" className="site-section site-install" id="install">
        <div className="site-install__device" aria-hidden="true">
          <div className="site-install__speaker" />
          <div className="site-install__screen">
            <span>FIRE YOUR</span>
            <strong>COWORKERS</strong>
            <div className="site-install__elevator">
              <MicroManagingCeo className="site-install__ceo" />
            </div>
            <b>FLOOR 01</b>
          </div>
        </div>
        <div className="site-install__copy">
          <p className="site-kicker">Browser first. Pocket ready.</p>
          <h2 id="install-title">The elevator goes where work follows you.</h2>
          <p>
            Open the game on desktop or mobile, then install it from a supported browser when the
            install option appears. The starter floor is designed to stay available after its first load.
          </p>
          <ol>
            <li>
              <span>01</span>
              Open Fire Your Coworkers in a supported mobile browser.
            </li>
            <li>
              <span>02</span>
              Choose Install or Add to Home Screen from the browser menu.
            </li>
            <li>
              <span>03</span>
              Launch straight into the office without a store detour.
            </li>
          </ol>
          <div className="site-install__actions">
            <InstallControl />
            <a className="site-secondary-link" href="#play">
              Play in the browser
            </a>
          </div>
        </div>
      </section>

      <section aria-labelledby="launch-list-title" className="site-section site-launch-list" id="launch-list">
        <div>
          <p className="site-kicker">The launch memo</p>
          <h2 id="launch-list-title">Be first in line when HR loses control.</h2>
          <p>
            Launch-list members will get the public-preview notice, new character files, and the
            first shareable office challenge. No inspirational management emails.
          </p>
        </div>
        <form aria-describedby="launch-list-status" className="site-launch-list__form">
          <label htmlFor="launch-list-email">Work-safe email address</label>
          <div>
            <input
              disabled
              id="launch-list-email"
              name="email"
              placeholder="Launch list opens with the public preview"
              type="email"
            />
            <button disabled type="submit">
              Signup opening soon
            </button>
          </div>
          <p id="launch-list-status">
            Nothing is collected until the secure launch-list connection is active.
          </p>
        </form>
      </section>

      <footer className="site-footer" id="site-footer">
        <div className="site-footer__brand">
          <a href="#top">Fire Your Coworkers</a>
          <p>Pack the office. Survive HR. Share the paperwork.</p>
        </div>
        <nav aria-label="Footer navigation" className="site-footer__nav">
          {sectionLinks.map(([label, href]) => (
            <a href={href} key={href}>
              {label}
            </a>
          ))}
          <a href="#launch-list">Launch list</a>
        </nav>
        <div className="site-footer__fineprint">
          <p>Original game concept and artwork. Public preview in progress.</p>
          <p>© 2026 Fire Your Coworkers</p>
        </div>
      </footer>
    </div>
  );
}
